import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";
import { queueNotification } from "@/services/notifications/queueNotification";
import { emitToUser } from "@/services/realtime/broadcast";
import { RealtimeEvent } from "@/services/realtime/events";

export interface SendMessageInput {
  conversationId: string;
  /** User.id des Absenders – aus der Server-Session, nie vom Client. */
  senderId: string;
  message: string;
}

export type SendMessageResult =
  | { status: "sent"; messageId: string; createdAt: Date }
  | { status: "not_participant" };

const ENQUEUE_TIMEOUT_MS = 5000;
const MESSAGE_PREVIEW_LENGTH = 200;

/**
 * Begrenzt die Wartezeit auf enqueue()/queueNotification()/queueTemplateEmail().
 * Nötig, weil ein try/catch allein NICHT vor einem nicht erreichbaren Redis
 * schützt: ioredis (maxRetriesPerRequest: null, siehe services/jobs/queue.ts)
 * retried einen einzelnen Befehl unbegrenzt im Hintergrund, das Promise würde
 * also nie ablehnen, sondern für immer hängen bleiben. Ohne dieses Timeout
 * würde der "Senden"-Button bei nicht erreichbarer Queue nie mehr reagieren
 * (gleiches Prinzip wie services/orders/createOrder.ts, Feature 73).
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

/**
 * Speichert eine Nachricht und aktualisiert `Conversation.updatedAt`
 * (für die Sortierung in getConversations.ts nach "zuletzt aktiv").
 * Ownership-Check: der Aufrufer muss Käufer ODER (über sein SellerProfile)
 * Verkäufer dieser Conversation sein – "nicht Teilnehmer" und "Conversation
 * existiert nicht" werden bewusst zu `not_participant` zusammengefasst
 * (kein Unterschied nach außen erkennbar), gleiches Prinzip wie an
 * anderen Stellen im Projekt (z. B. services/admin/getDashboard.ts).
 *
 * Löst nach dem Speichern (Feature 74) Best-Effort-Seiteneffekte für den
 * EMPFÄNGER (nicht den Absender) aus: Notification (immer) + E-Mail
 * (Template `newMessage`) + Realtime-Event (CHAT_MESSAGE, Foundation aus
 * Feature 54).
 *
 * Anders als bei services/orders/createOrder.ts (Webhook-Kontext, kein
 * wartender User) werden diese drei Seiteneffekte hier BEWUSST NICHT
 * awaited, bevor die Funktion zurückkehrt – "Senden" ist eine synchrone,
 * interaktive Aktion (Button-Ladezustand). Ein nicht erreichbares Redis
 * würde sonst (2 sequentielle withEnqueueTimeout-Timeouts) bis zu 10s
 * blockieren, obwohl die Nachricht selbst bereits gespeichert ist. Sie
 * laufen stattdessen nebenläufig im Hintergrund weiter (siehe
 * notifyRecipient() unten), inkl. eigener Fehlerbehandlung.
 */
async function notifyRecipient(params: {
  recipient: { userId: string; name: string; email: string };
  senderName: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  message: string;
  messagePreview: string;
  createdAt: Date;
}): Promise<void> {
  const conversationUrl = `/messages/${params.conversationId}`;

  // Realtime-Foundation (Feature 54) minimal integriert: emitToUser() ist
  // rein in-memory (kein Redis, kein Timeout nötig), liefert aber nur dann
  // tatsächlich etwas aus, wenn diese Funktion im selben Prozess läuft wie
  // der WebSocket-Server (services/realtime/server.ts, eigener Prozess
  // "npm run realtime") – in der aktuellen Prozess-Topologie (Next.js
  // Server Action ≠ Realtime-Server-Prozess) ist dieser Aufruf daher ein
  // No-Op (emitToUser() findet keine Verbindung, liefert 0 zurück), wird
  // aber bewusst korrekt aufgerufen, damit ein künftiges Deployment, das
  // beide Prozesse zusammenführt, sofort ohne weitere Änderung
  // funktioniert. Siehe Abschlussbericht.
  try {
    emitToUser(params.recipient.userId, RealtimeEvent.CHAT_MESSAGE, {
      conversationId: params.conversationId,
      messageId: params.messageId,
      senderId: params.senderId,
      message: params.message,
      createdAt: params.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(
      `[messages] Realtime-Event für Nachricht ${params.messageId} konnte nicht gesendet werden:`,
      error instanceof Error ? error.message : error,
    );
  }

  // Notification + E-Mail nebenläufig statt sequentiell – begrenzt die
  // maximale Hintergrund-Wartezeit auf ENQUEUE_TIMEOUT_MS statt dem
  // Doppelten, falls Redis nicht erreichbar ist.
  await Promise.allSettled([
    withEnqueueTimeout(
      queueNotification({
        userId: params.recipient.userId,
        type: NotificationType.MESSAGE,
        title: `Neue Nachricht von ${params.senderName}`,
        message: params.messagePreview,
        link: conversationUrl,
      }),
    ).catch((error) => {
      console.error(
        `[messages] Notification für Nachricht ${params.messageId} konnte nicht eingereiht werden:`,
        error instanceof Error ? error.message : error,
      );
    }),
    withEnqueueTimeout(
      queueTemplateEmail({
        template: "newMessage",
        to: params.recipient.email,
        data: {
          recipientName: params.recipient.name,
          senderName: params.senderName,
          messagePreview: params.messagePreview,
          conversationUrl,
        },
      }),
    ).catch((error) => {
      console.error(
        `[messages] E-Mail für Nachricht ${params.messageId} konnte nicht eingereiht werden:`,
        error instanceof Error ? error.message : error,
      );
    }),
  ]);
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    select: {
      buyerId: true,
      buyer: { select: { name: true, email: true } },
      seller: { select: { userId: true, displayName: true, user: { select: { email: true } } } },
    },
  });

  if (!conversation) {
    return { status: "not_participant" };
  }

  const isParticipant =
    conversation.buyerId === input.senderId || conversation.seller.userId === input.senderId;

  if (!isParticipant) {
    return { status: "not_participant" };
  }

  const now = new Date();

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        message: input.message,
      },
      select: { id: true, createdAt: true },
    }),
    prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: now },
    }),
  ]);

  const senderIsBuyer = conversation.buyerId === input.senderId;
  const recipient = senderIsBuyer
    ? { userId: conversation.seller.userId, name: conversation.seller.displayName, email: conversation.seller.user.email }
    : { userId: conversation.buyerId, name: conversation.buyer.name, email: conversation.buyer.email };
  const senderName = senderIsBuyer ? conversation.buyer.name : conversation.seller.displayName;
  const messagePreview =
    input.message.length > MESSAGE_PREVIEW_LENGTH
      ? `${input.message.slice(0, MESSAGE_PREVIEW_LENGTH)}…`
      : input.message;

  // Bewusst nicht awaited (siehe Doc-Kommentar oben) – Fehler werden
  // innerhalb von notifyRecipient() selbst behandelt/geloggt, daher hier
  // nur ein Sicherheitsnetz gegen eine unerwartete, nicht abgefangene
  // Exception (kein unhandled rejection).
  void notifyRecipient({
    recipient,
    senderName,
    conversationId: input.conversationId,
    messageId: message.id,
    senderId: input.senderId,
    message: input.message,
    messagePreview,
    createdAt: message.createdAt,
  }).catch((error) => {
    console.error(
      `[messages] Unerwarteter Fehler bei Seiteneffekten für Nachricht ${message.id}:`,
      error instanceof Error ? error.message : error,
    );
  });

  return { status: "sent", messageId: message.id, createdAt: message.createdAt };
}
