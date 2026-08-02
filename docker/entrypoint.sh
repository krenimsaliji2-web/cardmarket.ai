#!/bin/bash
# Project Atlas – Container-Entrypoint (Feature 86).
#
# Läuft bei jedem Container-Start (nicht beim Image-Build, siehe Dockerfile-
# Kommentar): Migrationen anwenden, danach die bestehenden Hintergrund-
# prozesse (Job-Worker, Realtime-Server – beide unverändert über die
# vorhandenen package.json-Scripts) starten, zuletzt next start im
# Vordergrund als Hauptprozess.
set -e

echo "[entrypoint] Wende Datenbank-Migrationen an (prisma migrate deploy)..."
npx prisma migrate deploy
echo "[entrypoint] Migrationen angewendet."

# Hintergrundprozesse: bestehende, unveränderte Scripts (siehe package.json).
# Bekannte Einschränkung (dokumentiert in README "Bekannte Einschränkungen"):
# stürzt einer dieser Hintergrundprozesse ab, bleibt der Container dennoch
# "healthy" (der Docker-Healthcheck prüft ausschließlich /api/health, also
# PostgreSQL-/Redis-Erreichbarkeit, nicht den Prozessstatus von Worker/
# Realtime-Server) – für produktionskritische Job-Verarbeitung empfiehlt
# sich ein eigener, überwachter Prozess/Service statt dieser einfachen
# Variante.
echo "[entrypoint] Starte Job-Worker im Hintergrund..."
npm run jobs:worker &

echo "[entrypoint] Starte Realtime-Server im Hintergrund..."
npm run realtime &

echo "[entrypoint] Starte Next.js-Server..."
exec npm run start
