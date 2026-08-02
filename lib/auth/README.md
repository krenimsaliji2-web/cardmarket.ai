# lib/auth/

Better-Auth-Grundkonfiguration.

- `auth.ts` – Server-seitige Better-Auth-Instanz (Prisma-Adapter, `PrismaClient` aus `lib/prisma.ts`). Nur in Server-Kontexten importieren (Route Handlers, Server Components/Actions).
- `client.ts` – Browser-seitiger Auth-Client (`better-auth/react`) für spätere Client Components.
- `index.ts` – Barrel-Export der Server-Instanz (`@/lib/auth`).

Es sind noch keine Auth-Modelle (`User`, `Session`, `Account`, `Verification`) im Prisma-Schema und keine Migration vorhanden. Das ist der nächste Schritt, sobald Login/Registrierung umgesetzt werden:

1. `npx @better-auth/cli generate` – ergänzt die Modelle in `prisma/schema.prisma`
2. `npx prisma migrate dev` – wendet die Migration auf die Datenbank an
