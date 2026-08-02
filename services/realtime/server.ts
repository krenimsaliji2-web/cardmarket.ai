import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { fileURLToPath } from "node:url";

import { WebSocketServer, type WebSocket } from "ws";

import { auth } from "@/lib/auth";

import { addConnection } from "./connection";
import { handleDisconnect } from "./disconnect";

const DEFAULT_PORT = 3001;

/**
 * Node-Request-Header (`IncomingHttpHeaders`, teils Arrays für Mehrfach-
 * Header) in ein Web-`Headers`-Objekt umwandeln – `auth.api.getSession()`
 * erwartet dasselbe Format wie überall sonst im Projekt (`await headers()`
 * aus `next/headers`). Das ist dieselbe Better-Auth-Session-Prüfung wie
 * in jeder Server Action, nur auf den rohen HTTP-Upgrade-Request
 * angewendet statt auf einen Next.js-Request.
 */
function toWebHeaders(nodeHeaders: IncomingMessage["headers"]): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value === undefined) {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

export interface RealtimeServerHandle {
  httpServer: Server;
  wss: WebSocketServer;
  close: () => Promise<void>;
}

/**
 * Startet die WebSocket-Server-Foundation auf einem eigenen HTTP-Server
 * (eigener Port, standardmäßig 3001) – bewusst NICHT in den bestehenden
 * Next.js-Dev-/Build-/Start-Prozess integriert (siehe Zusammenfassung/
 * Architekturentscheidungen: ein Custom Server hätte `next dev
 * --turbopack`/`next build --turbopack`/`next start` für alle 53
 * bisherigen Features angefasst – außerhalb des Auftrags "arbeite
 * ausschließlich an diesem Feature").
 *
 * Authentifizierung läuft VOR dem eigentlichen WebSocket-Upgrade: Der
 * `upgrade`-Handler des rohen HTTP-Servers prüft zuerst die Better-Auth-
 * Session anhand des Cookie-Headers (`userId` kommt ausschließlich
 * daraus, nie von Client-Daten) und lehnt nicht eingeloggte Verbindungs-
 * versuche mit `401` ab, BEVOR überhaupt ein WebSocket entsteht.
 */
export function startRealtimeServer(port: number = DEFAULT_PORT): RealtimeServerHandle {
  const httpServer = createServer();
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    void (async () => {
      try {
        const session = await auth.api.getSession({ headers: toWebHeaders(request.headers) });

        if (!session) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request, session.user.id);
        });
      } catch {
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      }
    })();
  });

  wss.on("connection", (ws: WebSocket, _request: IncomingMessage, userId: string) => {
    const socketId = randomUUID();

    addConnection({ socketId, userId, socket: ws, connectedAt: new Date() });

    ws.on("close", () => handleDisconnect(socketId, ws));
    ws.on("error", () => handleDisconnect(socketId, ws));
  });

  httpServer.listen(port);

  return {
    httpServer,
    wss,
    close: () =>
      new Promise<void>((resolve) => {
        wss.close(() => {
          httpServer.close(() => resolve());
        });
      }),
  };
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const port = Number(process.env.REALTIME_PORT) || DEFAULT_PORT;
  startRealtimeServer(port);
  console.log(`Realtime-WebSocket-Server läuft auf Port ${port}.`);
}
