# syntax=docker/dockerfile:1

# Project Atlas – Production Dockerfile (Feature 86)
#
# Debian "slim" statt Alpine: Prisma benötigt zur Laufzeit passende
# OpenSSL-/glibc-Bibliotheken für seine Engine-Binaries (migrate/schema
# engine – die Rust-Query-Engine selbst wird dank @prisma/adapter-pg NICHT
# mehr benötigt, siehe lib/prisma.ts). Alpine (musl) erfordert dafür
# zusätzliche, fehleranfällige `binaryTargets`-Konfiguration in
# prisma/schema.prisma – das wollen wir nicht anfassen ("keine
# Schemaänderungen", Ticket). Debian-slim funktioniert ohne solche
# Sonderbehandlung.
#
# Drei Stages:
#   deps    – vollständige Dependencies (inkl. devDependencies) für den Build
#   builder – prisma generate + next build
#   runner  – schlankes Produktions-Image (nur Production-Dependencies)

ARG NODE_VERSION=20-bookworm-slim

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` braucht keine erreichbare Datenbank (liest nur das
# Schema). `next build` ebenfalls nicht mehr, seit app/sitemap.ts explizit
# `force-dynamic` ist (siehe dortiger Kommentar) – beides läuft hier ohne
# Netzwerkzugriff auf den erst zur Laufzeit existierenden Postgres-Container.
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production

# tini als PID 1: reicht Signale (SIGTERM bei `docker compose down`/restart)
# korrekt an die Kindprozesse durch und reapt Zombies – der Container startet
# next start sowie im Hintergrund den Job-Worker und den Realtime-Server
# (siehe docker/entrypoint.sh), ohne tini würde ein einzelnes `sh`/`node`
# als PID 1 Signale nicht zuverlässig weiterleiten.
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

# Eigener, nicht-root Nutzer (Ticket: "Container möglichst nicht als root
# starten"). UID/GID 1001 ist bei Node-Docker-Images üblich und kollidiert
# nicht mit vorhandenen System-UIDs unter 1000.
RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# .next/public genügen für `next start` allein (fertig kompiliert). Der
# Job-Worker, Scheduler und Realtime-Server (siehe entrypoint.sh) laufen
# dagegen unverändert über `tsx` direkt auf dem TypeScript-Quellcode (wie
# in der lokalen Entwicklung, package.json-Scripts) statt über den
# Next.js-Build – dafür müssen services/lib/utils/types samt tsconfig.json
# (für die "@/*"-Pfadauflösung) zusätzlich im Image vorhanden sein.
# app/components/hooks werden bewusst NICHT kopiert: kein Server-seitiger
# Code außerhalb von app/ importiert daraus (verifiziert), sie stecken
# bereits fertig kompiliert in .next.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/services ./services
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/types ./types
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

# Mountpunkte für persistente Docker Volumes (siehe docker-compose.yml).
# LocalStorageProvider/createInvoice legen diese Verzeichnisse bei Bedarf
# selbst an (mkdir -p), das vorherige Anlegen stellt nur sicher, dass der
# nextjs-Nutzer (nicht root) bereits Schreibrechte hat, bevor ein Volume
# darübergemountet wird.
RUN mkdir -p ./public/uploads/listings ./public/invoices \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "./docker/entrypoint.sh"]
