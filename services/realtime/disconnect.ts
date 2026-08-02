import type { WebSocket } from "ws";

import { removeConnection } from "./connection";

/**
 * Zentrale Cleanup-Routine für eine geschlossene/fehlerhafte Verbindung.
 * Wird von server.ts sowohl bei `close` als auch bei `error` aufgerufen –
 * beide Fälle laufen über genau diese eine Funktion, damit die
 * Registrierung nie doppelt oder gar nicht bereinigt wird.
 *
 * `removeAllListeners()` verhindert, dass an einem bereits entfernten
 * Socket weiterhin Event-Handler hängen (Memory Leak, siehe
 * Performance-Anforderung "Keine Memory Leaks").
 */
export function handleDisconnect(socketId: string, socket: WebSocket): void {
  removeConnection(socketId);
  socket.removeAllListeners();
}
