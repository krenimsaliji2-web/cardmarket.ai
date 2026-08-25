import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";

import { prisma } from "@/lib/prisma";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const ENQUEUE_TIMEOUT_MS = 5000;

/**
 * Begrenzt die Wartezeit auf enqueue() (queueTemplateEmail()) auf
 * ENQUEUE_TIMEOUT_MS. Nötig, weil better-auth sendResetPassword ohne
 * konfigurierten `advanced.backgroundTasks.handler` über
 * `runInBackgroundOrAwait()` SYNCHRON awaited (siehe
 * node_modules/better-auth/dist/context/create-context.mjs) – ein nicht
 * erreichbares Redis (ioredis retried unbegrenzt, maxRetriesPerRequest:
 * null, siehe services/jobs/queue.ts) würde sonst den kompletten
 * "Passwort vergessen"-Request des Users hängen lassen. Gleiches Prinzip
 * wie services/orders/createOrder.ts (Feature 73) und
 * services/messages/sendMessage.ts (Feature 74).
 */
function withEnqueueTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Job-Queue nicht erreichbar (Timeout nach ${ENQUEUE_TIMEOUT_MS}ms).`)),
        ENQUEUE_TIMEOUT_MS,
      ),
    ),
  ]);
}

// Release Candidate 3 – Produktionsvalidierung: Ein fehlendes oder leeres
// BETTER_AUTH_SECRET wurde von better-auth bisher stillschweigend akzeptiert
// (Sessions wurden trotzdem ausgestellt, nur eben mit einem leeren/trivialen
// Signing-Key signiert) – kein Startfehler, keine Warnung, einfach ein
// unbemerkt unsicherer Zustand. .env.example dokumentiert bereits "mindestens
// 32 Zeichen" (openssl rand -base64 32); das wird hier tatsächlich
// durchgesetzt, damit ein fehlkonfiguriertes Deployment laut und sofort statt
// still und unsicher scheitert.
if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET fehlt oder ist kürzer als 32 Zeichen. Generieren mit: openssl rand -base64 32 (siehe .env.example).",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // Feature 79 – Release Readiness: "Passwort vergessen?" verlinkte ins
    // Leere (kein sendResetPassword konfiguriert, keine Seiten). Nutzt
    // ausschließlich bestehende Infrastruktur: die bereits vorhandene
    // Queue (queueTemplateEmail(), Feature 56) und das bereits vorhandene,
    // bislang nie verwendete `passwordReset`-Template (Feature-56-Foundation).
    sendResetPassword: async ({ user, url }) => {
      try {
        await withEnqueueTimeout(
          queueTemplateEmail({
            template: "passwordReset",
            to: user.email,
            data: { userName: user.name, resetUrl: url },
          }),
        );
      } catch (error) {
        console.error(
          `[auth] Passwort-Reset-E-Mail für ${user.email} konnte nicht eingereiht werden:`,
          error instanceof Error ? error.message : error,
        );
      }
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        input: true,
      },
      // Nur lesbar: darf niemals über den Sign-Up-/Update-Request gesetzt
      // werden, damit niemand sich selbst z. B. zu "ADMIN" machen kann.
      role: {
        type: "string",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const username = (user as { username?: unknown }).username;

          if (typeof username !== "string" || !USERNAME_REGEX.test(username)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Der Benutzername muss 3–30 Zeichen lang sein und darf nur Buchstaben, Zahlen und Unterstriche enthalten.",
            });
          }

          const existing = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
          });

          if (existing) {
            throw new APIError("BAD_REQUEST", {
              message: "Dieser Benutzername ist bereits vergeben.",
            });
          }

          return { data: user };
        },
      },
    },
  },
});
