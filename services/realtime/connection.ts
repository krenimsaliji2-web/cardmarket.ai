import type { WebSocket } from "ws";

export interface Connection {
  socketId: string;
  userId: string;
  socket: WebSocket;
  connectedAt: Date;
}

// userId -> alle offenen Verbindungen dieses Users (mehrere Geräte/Tabs erlaubt).
const connectionsByUser = new Map<string, Set<Connection>>();
// socketId -> Connection, für O(1)-Zugriff beim Cleanup (disconnect.ts).
const connectionsBySocketId = new Map<string, Connection>();

/**
 * Registriert eine neu authentifizierte Verbindung. Wird ausschließlich
 * von server.ts nach erfolgreicher Session-Prüfung aufgerufen – niemals
 * mit einer vom Client behaupteten `userId`.
 */
export function addConnection(connection: Connection): void {
  connectionsBySocketId.set(connection.socketId, connection);

  const existing = connectionsByUser.get(connection.userId);
  if (existing) {
    existing.add(connection);
  } else {
    connectionsByUser.set(connection.userId, new Set([connection]));
  }
}

/**
 * Entfernt eine Verbindung aus beiden Maps (Memory-Cleanup bei Disconnect,
 * siehe disconnect.ts). Idempotent – ein zweiter Aufruf mit derselben
 * `socketId` ist ein No-Op, kein Fehler.
 */
export function removeConnection(socketId: string): void {
  const connection = connectionsBySocketId.get(socketId);
  if (!connection) {
    return;
  }

  connectionsBySocketId.delete(socketId);

  const userConnections = connectionsByUser.get(connection.userId);
  if (userConnections) {
    userConnections.delete(connection);
    if (userConnections.size === 0) {
      connectionsByUser.delete(connection.userId);
    }
  }
}

/** Alle offenen Verbindungen eines Users (leeres Array, falls keine offen sind). */
export function getConnectionsForUser(userId: string): Connection[] {
  return Array.from(connectionsByUser.get(userId) ?? []);
}

/** Alle offenen Verbindungen, über alle User hinweg (für broadcast.ts). */
export function getAllConnections(): Connection[] {
  return Array.from(connectionsBySocketId.values());
}

/** Anzahl offener Verbindungen (Sockets), nicht Anzahl unterschiedlicher User. */
export function getConnectionCount(): number {
  return connectionsBySocketId.size;
}

/** Anzahl unterschiedlicher verbundener User (mehrere Geräte zählen einmal). */
export function getConnectedUserCount(): number {
  return connectionsByUser.size;
}
