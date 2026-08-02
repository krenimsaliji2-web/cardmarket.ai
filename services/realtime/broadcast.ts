import { WebSocket } from "ws";

import { prisma } from "@/lib/prisma";

import { getAllConnections, getConnectionsForUser, type Connection } from "./connection";
import type { RealtimeEvent, RealtimeMessage } from "./events";

/**
 * Dies ist die EINZIGE Stelle, die tatsächlich auf einen Socket schreibt.
 * Sendet nur an offene Verbindungen (`readyState === OPEN`) – ein Socket
 * kann zwischen Nachschlagen in der Connection-Map und dem Sendeversuch
 * bereits im Schließen begriffen sein (`CLOSING`/`CLOSED`), das wird hier
 * stillschweigend übersprungen statt einen Fehler zu werfen.
 */
function send(connection: Connection, event: RealtimeEvent, payload: unknown): boolean {
  if (connection.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const message: RealtimeMessage = { event, payload, sentAt: new Date().toISOString() };
  connection.socket.send(JSON.stringify(message));
  return true;
}

/**
 * Sendet ein Event an alle offenen Verbindungen eines Users (alle Geräte/
 * Tabs). Dies ist die zentrale Funktion, über die zukünftige Features
 * (Chat, Notifications, Price Alerts, ...) Echtzeit-Events an einen
 * bestimmten User schicken sollen – DIESES Feature ruft sie an keiner
 * Stelle selbst auf (reine Foundation).
 */
export function emitToUser(userId: string, event: RealtimeEvent, payload: unknown): number {
  const connections = getConnectionsForUser(userId);
  return connections.filter((connection) => send(connection, event, payload)).length;
}

/** Wie emitToUser(), für mehrere User gleichzeitig (z. B. alle Follower eines Verkäufers). */
export function emitToUsers(userIds: string[], event: RealtimeEvent, payload: unknown): number {
  return userIds.reduce((total, userId) => total + emitToUser(userId, event, payload), 0);
}

/**
 * Sendet ein Event an den User HINTER einem SellerProfile (Verkäufer
 * werden im Projekt durchgehend über SellerProfile adressiert, nie
 * direkt über eine User-ID – siehe Listing.sellerId/Review.sellerId/
 * Conversation.sellerId/SellerFollow.sellerProfileId). Liefert 0, falls
 * das SellerProfile nicht existiert oder der Verkäufer nicht verbunden ist.
 */
export async function emitToSeller(
  sellerProfileId: string,
  event: RealtimeEvent,
  payload: unknown,
): Promise<number> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: { userId: true },
  });

  if (!seller) {
    return 0;
  }

  return emitToUser(seller.userId, event, payload);
}

/** Sendet ein Event an ALLE verbundenen Clients, unabhängig vom User. */
export function broadcast(event: RealtimeEvent, payload: unknown): number {
  const connections = getAllConnections();
  return connections.filter((connection) => send(connection, event, payload)).length;
}
