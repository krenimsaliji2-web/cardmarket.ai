# Project Atlas

KI-gestützter Trading-Card-Marktplatz. Next.js 15 (App Router) · TypeScript ·
Prisma 7 · MariaDB · Better Auth · Stripe · BullMQ/Redis.

## Inhalt

- [Installation](#installation)
- [Environment](#environment)
- [Development](#development)
- [Build](#build)
- [Production](#production)
- [Deployment](#deployment)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [MariaDB](#mariadb)
- [Redis & Queue](#redis--queue)
- [Scheduler](#scheduler)
- [Stripe](#stripe)
- [Monitoring](#monitoring-vorbereitung)

## Installation

Voraussetzungen:

- Node.js `>= 20` (siehe `engines` in `package.json`)
- Eine laufende MariaDB-/MySQL-Instanz
- Eine laufende Redis-Instanz (nur nötig für Background Jobs/Scheduler, siehe unten)

```bash
npm install
cp .env.example .env
# .env mit echten Werten befüllen (siehe Environment)
npx prisma migrate deploy
npx prisma generate
npm run seed              # legt die 5 unterstützten Spiele an
npm run import:pokemon    # optional: Katalogdaten laden, siehe "Katalogimport" unten
npm run dev
```

## Environment

Alle Variablen sind in `.env.example` mit Beschreibung dokumentiert. Kurzüberblick:

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `DATABASE_URL` | ja | MariaDB-/MySQL-Connection-String (Prisma) |
| `BETTER_AUTH_SECRET` | ja | Session-/Token-Signierung (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | ja | Server-seitige Basis-URL von Better Auth |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | ja | Öffentliche Basis-URL der App – dient **gleichzeitig** als Quelle für Stripe-Redirect-URLs, `robots.txt` und `sitemap.xml` (kein separates `NEXT_PUBLIC_APP_URL` nötig) |
| `STRIPE_SECRET_KEY` | ja (für Checkout) | Stripe API Secret Key |
| `STRIPE_WEBHOOK_SECRET` | ja (für Checkout) | Signing Secret des Stripe-Webhooks (`/api/stripe/webhook`) |
| `REDIS_URL` | ja (für Queue/Scheduler) | Verbindung für BullMQ (Background Jobs) |
| `JOBS_WORKER_CONCURRENCY` | nein | Worker-Parallelität, Default `5` |
| `SCHEDULER_ENABLED` | nein | Muss explizit `"true"` sein, damit der Scheduler produktiv Jobs auslöst. Default `false` |
| `REALTIME_PORT` | nein | Port des WebSocket-Servers, Default `3001` |
| `ONE_PIECE_API_KEY` | nein (nur für `npm run import:onepiece`) | Key für apitcg.com (https://apitcg.com/platform) – für alle anderen Katalogimporte nicht nötig |
| `MARIADB_ROOT_PASSWORD` / `MARIADB_USER` / `MARIADB_PASSWORD` / `MARIADB_DATABASE` | nur für Docker Compose | Zugangsdaten des `mariadb`-Containers – `DATABASE_URL` für den `app`-Container wird daraus automatisch zusammengesetzt (siehe [Docker Deployment](#docker-deployment)). Ohne Docker ohne Wirkung. |
| `DOMAIN` | nur für Docker Compose | Hostname für nginx/Let's-Encrypt-Zertifikat (siehe [HTTPS](#https-1)). Ohne Docker ohne Wirkung. |
| `CERTBOT_EMAIL` | nein | Kontakt-E-Mail für Let's-Encrypt-Ablaufbenachrichtigungen. |

`.env` ist in `.gitignore` eingetragen und darf niemals committet werden.

## Development

```bash
npm run dev
```

Startet den Next.js-Dev-Server (Turbopack) auf `http://localhost:3000`. Für
lokale Zahlungen zusätzlich Stripe-Events weiterleiten:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Optional (nur nötig, wenn die jeweilige Funktion getestet werden soll):

```bash
npm run jobs:worker   # Background-Job-Worker (Redis erforderlich)
npm run scheduler     # Scheduler-Prozess (SCHEDULER_ENABLED=true erforderlich)
npm run realtime      # WebSocket-Server (eigener Prozess, Port 3001)
```

## Build

```bash
npx tsc --noEmit   # Typprüfung
npm run lint       # ESLint
npm run build      # Produktions-Build (next build --turbopack)
```

Alle drei müssen ohne Fehler durchlaufen, bevor deployt wird.

## Production

```bash
npm run build
npm run start
```

`next start` erwartet exakt die Umgebungsvariablen aus `.env` (siehe
Environment) sowie eine erreichbare MariaDB-/MySQL-Instanz. Redis ist für den
reinen Seitenbetrieb (SSR, Checkout, Auth) **nicht** erforderlich – nur für
Background Jobs und den Scheduler (siehe unten). Ist Redis nicht erreichbar,
degradieren die betroffenen Aktionen kontrolliert (Timeout, siehe
`services/orders/createOrder.ts`, `services/messages/sendMessage.ts`,
`lib/auth/auth.ts`) statt den Request unbegrenzt zu blockieren.

## Deployment

> Für einen neuen Server ist [Docker Deployment](#docker-deployment) unten der
> empfohlene, vollständig dokumentierte Weg (`git clone` → `.env` anlegen →
> `docker compose up -d`). Dieser Abschnitt beschreibt den manuellen
> Deployment-Weg ohne Docker (z. B. bei bereits vorhandener eigener
> Infrastruktur).

- Node-Prozess: `npm run build && npm run start` (Next.js Standalone-Server, Port `3000`, `PORT`-Env-Var wird von `next start` respektiert).
- Datenbank-Migrationen vor jedem Deploy: `npx prisma migrate deploy` (kein `migrate dev` in Produktion).
- Background-Job-Worker (`npm run jobs:worker`) und Scheduler (`npm run scheduler`) laufen als **eigenständige Prozesse**, nicht im Next.js-Server – bei Bedarf als separate Deployment-Einheiten/Prozesse betreiben.
- Der Realtime-WebSocket-Server (`npm run realtime`) läuft ebenfalls als eigener Prozess auf einem separaten Port; er teilt sich aktuell keine Verbindungs-Registry mit dem Next.js-Prozess (siehe Bekannte Einschränkungen unten).
- SSR/dynamische Routen benötigen zur Laufzeit Datenbankzugriff – kein rein statisches Hosting möglich.

### Bekannte Einschränkungen

- Der Realtime-WebSocket-Server hält seine Verbindungs-Registry In-Memory
  und ausschließlich im eigenen Prozess. Läuft er getrennt vom Next.js-
  Prozess (Standardfall), kommen serverseitig ausgelöste Realtime-Events
  (z. B. neue Chat-Nachrichten) dort aktuell nicht an. Die Anwendungsseite
  ist bereits korrekt integriert (siehe `services/messages/sendMessage.ts`)
  – eine spätere Zusammenführung beider Prozesse (oder ein Pub/Sub-Bridge)
  würde ohne weitere Codeänderung funktionieren.
- Ein vollständiger, paginierter Sitemap über alle Karten/Listings existiert
  bewusst nicht (`app/sitemap.ts` deckt nur stabile Top-Level-Seiten ab) –
  das wäre ein eigenständiges Feature.

## Docker Deployment

Feature 86 – vollständig produktionsreifes Deployment auf einem neuen
Linux-Server via Docker Compose. Nach `git clone` sind ausschließlich diese
beiden Schritte nötig:

```bash
cp .env.example .env   # anschließend mit echten Werten befüllen, siehe unten
docker compose up -d
```

Vier Container, keine weiteren: `app` (Next.js), `mariadb`, `redis`,
`nginx`.

### Voraussetzungen

- Ein Linux-Server (getestet gegen Debian/Ubuntu; jede Distribution mit
  Docker-Unterstützung funktioniert) mit öffentlicher IP.
- Docker Engine ≥ 24 und das Docker-Compose-Plugin (`docker compose`, ohne
  Bindestrich – nicht das alte, separate `docker-compose`-Python-Tool).
- Eine Domain, deren DNS-A-Record auf die Server-IP zeigt (nur nötig für ein
  echtes Let's-Encrypt-Zertifikat, siehe [HTTPS](#https-1) – für einen
  reinen Funktionstest reicht `DOMAIN=localhost`).
- Ports 80 und 443 müssen extern erreichbar sein (Firewall/Security-Group).
- Ein Stripe-Account (Sandbox reicht zum Testen) für Checkout/Webhook.

### Linux-Setup

Docker Engine gemäß der offiziellen Anleitung installieren
(<https://docs.docker.com/engine/install/>), z. B. auf Debian/Ubuntu:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # neu einloggen, damit die Gruppe wirkt
```

Danach das Repository klonen:

```bash
git clone <repository-url> project-atlas
cd project-atlas
```

### Docker

- `Dockerfile` – Multi-Stage-Build (`deps` → `builder` → `runner`).
  `deps`/`builder` installieren alle Dependencies und führen `prisma
  generate` sowie `next build` aus. `runner` installiert ausschließlich
  Production-Dependencies frisch (`npm ci --omit=dev`), läuft als
  nicht-root-Nutzer (`nextjs`, UID 1001) und enthält einen Docker-
  `HEALTHCHECK` gegen `/api/health`.
- Basis-Image `node:20-bookworm-slim` (Debian, kein Alpine): Prisma
  benötigt zur Laufzeit passende OpenSSL-/glibc-Bibliotheken für seine
  Migrations-Engine – auf Alpine (musl) wäre dafür eine zusätzliche
  `binaryTargets`-Konfiguration in `prisma/schema.prisma` nötig, die
  laut Ticket nicht angefasst werden soll.
- `docker/entrypoint.sh` läuft bei **jedem Container-Start** (nicht beim
  Image-Build) und führt in dieser Reihenfolge aus: `prisma migrate
  deploy` → Job-Worker (`npm run jobs:worker`) im Hintergrund →
  Realtime-Server (`npm run realtime`) im Hintergrund → `next start` im
  Vordergrund. Migrationen laufen bewusst erst zur Laufzeit, nicht beim
  Image-Build, da dafür eine erreichbare Datenbank nötig ist, die beim
  isolierten `docker build` noch nicht existiert (erst
  `docker compose up` startet den `mariadb`-Container).
- `.dockerignore` schließt `node_modules`, `.next`, `.env`, `public/uploads`,
  `public/invoices` u. a. vom Build-Kontext aus.

### Docker Compose

`docker-compose.yml` definiert:

| Service | Image / Build | Zweck |
| --- | --- | --- |
| `app` | `./Dockerfile` | Next.js-Server, Job-Worker, Realtime-Server (siehe oben). Kein Port nach außen – nur über `nginx` erreichbar. |
| `mariadb` | `mariadb:11` | Datenbank, persistentes Volume `mariadb_data`. |
| `redis` | `redis:7-alpine` | Queue-Backend für BullMQ (`services/jobs/`). |
| `nginx` | `./nginx/Dockerfile` | Reverse Proxy, TLS-Terminierung, siehe [HTTPS](#https-1). Einziger Container mit nach außen offenen Ports (80/443). |

Persistente Volumes: `mariadb_data`, `uploads_data`
(→ `public/uploads` im `app`-Container, siehe
`services/storage/LocalStorageProvider.ts`), `invoices_data`
(→ `public/invoices`, siehe `services/invoices/createInvoice.ts`),
`certbot_webroot`, `certbot_certs`. Alle vier überleben
`docker compose down` (nicht aber `docker compose down -v`).

`DATABASE_URL` und `REDIS_URL` werden für den `app`-Container automatisch
im internen Docker-Netzwerk zusammengesetzt (`mariadb`/`redis` als
Hostname statt `localhost`) – die Werte aus `.env` gelten nur für lokale
Entwicklung ohne Docker, siehe Kommentare in `docker-compose.yml`.

```bash
docker compose up -d          # Start (baut Images beim ersten Mal automatisch)
docker compose ps             # Status/Healthchecks aller Container
docker compose logs -f app    # Logs des app-Containers live verfolgen
docker compose down           # Stoppen, Volumes bleiben erhalten
```

### .env

`.env.example` kopieren und ausfüllen (siehe [Environment](#environment)
für alle Variablen). Für Docker Compose zusätzlich wichtig:

- `MARIADB_ROOT_PASSWORD`, `MARIADB_USER`, `MARIADB_PASSWORD`,
  `MARIADB_DATABASE` – Datenbank-Zugangsdaten. Passwort möglichst ohne
  `@ : /` (werden bei der automatischen `DATABASE_URL`-Zusammensetzung
  nicht URL-kodiert).
- `DOMAIN` – Hostname für nginx/Let's Encrypt.
- `NEXT_PUBLIC_BETTER_AUTH_URL` und `BETTER_AUTH_URL` – auf
  `https://<DOMAIN>` setzen (nicht `localhost`), sobald ein echtes
  Zertifikat vorliegt.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` – siehe
  [Stripe Webhooks](#stripe-webhooks-1) unten.

`.env` wird von Docker Compose automatisch gelesen (sowohl für die
`${VARIABLE}`-Interpolation in `docker-compose.yml` als auch über
`env_file:` für den `app`-Container) – keine separate Docker-`.env` nötig.

### HTTPS

nginx verlangt für den HTTPS-Server-Block immer ein Zertifikat unter
`/etc/letsencrypt/live/${DOMAIN}/`. Damit `docker compose up -d` auf einem
komplett neuen Server trotzdem sofort funktioniert (bevor je ein echtes
Zertifikat bezogen wurde), erzeugt der `nginx`-Container beim allerersten
Start automatisch ein **selbstsigniertes Platzhalter-Zertifikat** an genau
dieser Stelle (siehe `nginx/docker-entrypoint-wrapper.sh`). Die Seite ist
damit sofort über HTTPS erreichbar, der Browser zeigt aber eine
Zertifikatswarnung, bis ein echtes Let's-Encrypt-Zertifikat vorliegt.

Echtes Zertifikat beziehen (Domain muss vorher per DNS auf den Server
zeigen, Port 80 muss erreichbar sein – `docker compose up -d` muss also
bereits laufen):

```bash
docker run --rm \
  -v project-atlas_certbot_webroot:/var/www/certbot \
  -v project-atlas_certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email
docker compose restart nginx
```

certbot legt das echte Zertifikat exakt an derselben Stelle ab, an der
zuvor das Platzhalter-Zertifikat lag – keine Konfigurationsänderung nötig,
`docker compose restart nginx` genügt. Kein eigener certbot-Container
(Ticket: "keine weiteren Container") – certbot läuft ad-hoc über
`docker run` und beendet sich danach wieder.

Erneuerung (Let's-Encrypt-Zertifikate sind 90 Tage gültig) – denselben
Befehl regelmäßig per Cron ausführen, z. B. `crontab -e` auf dem Host:

```cron
0 3 * * 1 docker run --rm -v project-atlas_certbot_webroot:/var/www/certbot -v project-atlas_certbot_certs:/etc/letsencrypt certbot/certbot renew --webroot -w /var/www/certbot -q && docker compose -f /pfad/zu/project-atlas/docker-compose.yml restart nginx
```

nginx selbst (`nginx/templates/app.conf.template`) übernimmt: HTTP→HTTPS-
Redirect, gzip, WebSocket-Proxying (`/realtime/` → Realtime-Server im
`app`-Container), Security-Header (`X-Frame-Options`,
`X-Content-Type-Options`, `Strict-Transport-Security` u. a.), Caching für
`/_next/static/` sowie `client_max_body_size 15m` für Listing-Bild-Uploads.

### Migrationen

Laufen automatisch bei jedem Container-Start (`docker/entrypoint.sh` →
`prisma migrate deploy`, siehe oben) – kein manueller Schritt nötig, auch
nicht nach einem Update (siehe unten).

### Deployment

Erststart auf einem neuen Server:

```bash
git clone <repository-url> project-atlas && cd project-atlas
cp .env.example .env && nano .env      # echte Werte eintragen
docker compose up -d
docker compose exec app npm run seed   # legt die 5 unterstützten Spiele an
# optional: Katalogdaten laden (siehe "Katalogimport" oben), z. B.
docker compose exec app npm run import:pokemon
```

`docker compose ps` zeigt den Health-Status aller Container;
`/api/health` (über nginx: `https://<DOMAIN>/api/health`) liefert `200`,
sobald MariaDB erreichbar ist.

### Updates

```bash
git pull
docker compose up -d --build   # baut das app-Image neu, Migrationen laufen automatisch beim Neustart
```

Kein manueller Migrations- oder Downtime-Schritt nötig – `docker compose
up -d --build` ersetzt nur den `app`-Container (bzw. `nginx`, falls sich
dessen Dateien geändert haben), `mariadb`/`redis` und ihre Volumes bleiben
unangetastet.

Für ein Docker-loses Setup siehe [Vercel Deployment](#vercel-deployment)
unten – dort übernimmt `.github/workflows/deploy.yml` genau diesen
Update-Schritt automatisch, ganz ohne SSH/Server.

## Vercel Deployment

Alternative zu [Docker Deployment](#docker-deployment) ohne eigenen Server,
ohne Docker, ohne sichtbare Ports – Next.js läuft direkt als
Vercel-Deployment, erreichbar ausschließlich über eine URL.

### Einrichtung (einmalig)

1. Vercel-Account erstellen, auf vercel.com "Add New Project" → dieses
   GitHub-Repo auswählen. Next.js wird automatisch erkannt, keine
   Konfiguration nötig.
2. Alle Variablen aus [Environment](#environment) im Vercel-Projekt
   hinterlegen (Project Settings → Environment Variables) – `DATABASE_URL`,
   `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `REDIS_URL` usw.
3. Datenbank/Redis extern hosten (Vercel selbst hostet keine Datenbank) –
   z. B. [PlanetScale](https://planetscale.com) für MySQL-kompatible
   Datenbanken, [Upstash](https://upstash.com) für Redis. Beide sind
   ebenfalls serverlos: nur eine Connection-URL, kein eigener Server.
4. `npx prisma migrate deploy` einmalig gegen die neue Produktionsdatenbank
   ausführen (lokal, mit der echten `DATABASE_URL` in `.env`).

Danach ist bereits jeder Push auf `main` automatisch live – das ist
Vercels eingebaute GitHub-Integration, dafür ist kein Workflow nötig.

### Automatisiertes Deployment über GitHub Actions

`.github/workflows/deploy.yml` deployt zusätzlich explizit über die
Vercel-CLI (offizielles Vercel-CI/CD-Muster) – sinnvoll, wenn der
Deployment-Status im GitHub-Actions-Tab sichtbar sein soll. Benötigte
Repository-Secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret | Wert |
| --- | --- |
| `VERCEL_TOKEN` | Erzeugen unter vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Aus `vercel link` (lokal `npx vercel link` einmal ausführen) oder den Vercel-Projekteinstellungen |
| `VERCEL_PROJECT_ID` | Ebenfalls aus `vercel link` bzw. den Projekteinstellungen |

### Bekannte Einschränkung: keine dauerhaften Prozesse

Vercel führt ausschließlich kurzlebige Serverless-Funktionen aus.
`services/jobs/worker.ts` (Background-Jobs: E-Mails, Preisalarme,
Katalog-Import) und `services/realtime/server.ts` (WebSocket-Server) sind
dauerhaft laufende Node-Prozesse – die kann Vercel **nicht** hosten.

Was trotzdem funktioniert: Login, Registrierung, Marketplace, Checkout,
Chat (per Seitenaufruf/Server Action, ohne Live-Push) – die bestehende
Timeout-Fallback-Architektur (siehe [Redis & Queue](#redis--queue)) fängt
die fehlende Job-Verarbeitung bereits ab, kein Request hängt.

Was NICHT läuft, ohne weitere Massnahme: automatischer E-Mail-Versand
(Passwort-Reset, Bestellbestätigung landet nur in der Queue, wird nie
abgeholt), Preisalarme, Live-Push im Chat. Für diese Funktionen Worker und
Realtime-Server auf einem separaten, dauerhaft laufenden Dienst betreiben
(z. B. einem kleinen Railway/Render-Service oder einem einzelnen kleinen
VPS nur dafür) und dort auf denselben `REDIS_URL`/`DATABASE_URL` wie das
Vercel-Deployment zeigen lassen.

### Backup

MariaDB-Dump (empfohlen: regelmäßig per Cron):

```bash
docker compose exec -T mariadb mariadb-dump -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" > backup-$(date +%F).sql
```

Uploads/Rechnungen sichern (Docker Volumes):

```bash
docker run --rm -v project-atlas_uploads_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
docker run --rm -v project-atlas_invoices_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/invoices-$(date +%F).tar.gz -C /data .
```

### Restore

```bash
cat backup-2026-01-01.sql | docker compose exec -T mariadb mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"

docker run --rm -v project-atlas_uploads_data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/uploads-2026-01-01.tar.gz -C /data"
docker run --rm -v project-atlas_invoices_data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/invoices-2026-01-01.tar.gz -C /data"

docker compose restart app
```

### Stripe Webhooks

`STRIPE_WEBHOOK_SECRET` in `.env` muss zum in Produktion im Stripe-
Dashboard angelegten Webhook-Endpunkt passen (nicht das lokale `stripe
listen`-Secret aus der Entwicklung). Endpunkt-URL im Stripe-Dashboard:
`https://<DOMAIN>/api/stripe/webhook`. Siehe auch [Stripe](#stripe) unten
für die Signaturprüfung selbst (unverändert, `app/api/stripe/webhook/route.ts`).

### Redis

Läuft als eigener Container (`redis:7-alpine`), ohne persistentes Volume
(Warteschlangeninhalte gelten als verzichtbar, siehe bestehende
Timeout-Fallback-Architektur unter [Redis & Queue](#redis--queue) unten –
das war schon vor diesem Ticket so und wird hier nicht geändert). Der
Job-Worker läuft automatisch im `app`-Container mit (siehe
`docker/entrypoint.sh`).

### Troubleshooting

- **`docker compose up -d` schlägt beim `app`-Build fehl** – Logs prüfen:
  `docker compose logs app`. Häufigste Ursache: `.env` unvollständig
  (siehe [Environment](#environment)).
- **nginx startet nicht / "cannot load certificate"** – `DOMAIN` in `.env`
  nicht gesetzt (siehe `nginx/docker-entrypoint-wrapper.sh`, das
  Platzhalter-Zertifikat wird nur erzeugt, wenn `DOMAIN` einen Wert hat).
- **`/api/health` liefert 503** – `docker compose logs mariadb` bzw.
  `docker compose ps` prüfen; meist ist die Datenbank noch beim Starten
  (`start_period` im Healthcheck) oder `MARIADB_*`/`.env` stimmen nicht
  mit einem bereits existierenden `mariadb_data`-Volume überein (Passwort
  wird nur beim allerersten Start des Volumes gesetzt).
- **Browser zeigt Zertifikatswarnung** – erwartet, bis ein echtes
  Let's-Encrypt-Zertifikat bezogen wurde, siehe [HTTPS](#https-1).
- **Uploads/Rechnungen verschwinden nach `docker compose down`** – nur bei
  `docker compose down -v` (löscht Volumes!) oder `docker volume rm`.
  Normales `docker compose down`/`up` behält alle Daten.
- **Migrationen schlagen bei einem Update fehl** – `docker compose logs
  app` prüfen; bei einer inkompatiblen manuellen Datenbankänderung hilft
  nur ein Restore aus dem letzten Backup (siehe oben).

## MariaDB

```bash
npx prisma migrate deploy   # Produktion: bestehende Migrationen anwenden
npx prisma migrate dev      # Entwicklung: neue Migration erstellen + anwenden
npx prisma generate         # Prisma Client neu generieren
npm run seed                # Games seeden (Pokémon/Yu-Gi-Oh!/Magic/Lorcana/One Piece)
```

Schema: `prisma/schema.prisma`. Migrationen: `prisma/migrations/`.

### Katalogimport

Befüllt Sets/Karten der jeweiligen Spiele (idempotent, mehrfach ausführbar,
keine Duplikate – jeder Importer nutzt `upsert()` über den eindeutigen
Set-/Karten-Schlüssel):

```bash
npm run import:pokemon    # pokemontcg.io, kein Key nötig
npm run import:yugioh     # YGOPRODeck API, kein Key nötig
npm run import:mtg        # Scryfall Bulk-Data, kein Key nötig (~98.000 Karten, dauert einige Minuten)
npm run import:lorcana    # Lorcast API, kein Key nötig
npm run import:onepiece   # apitcg.com, benötigt ONE_PIECE_API_KEY
```

## Redis & Queue

Background Jobs (E-Mail, Notifications, Preisalarme, Kataloge-Import,
Order-/Seller-/Marketplace-Events) laufen über BullMQ und benötigen eine
erreichbare Redis-Instanz (`REDIS_URL`).

```bash
npm run jobs:worker
```

Ist Redis nicht erreichbar, hängen Redis-abhängige Operationen **nicht**
den restlichen Request auf: alle synchron aus einer User-Aktion heraus
aufgerufenen Queue-Trigger (Checkout, Chat-Nachricht, Passwort-Reset) sind
mit einem 5-Sekunden-Timeout abgesichert (`withEnqueueTimeout`, siehe
`services/orders/createOrder.ts`, `services/messages/sendMessage.ts`,
`lib/auth/auth.ts`) – der kritische Pfad (z. B. die Zahlung selbst) bleibt
davon unberührt, nur die Benachrichtigung schlägt fehl und wird geloggt.

## Scheduler

```bash
SCHEDULER_ENABLED=true npm run scheduler
```

Registriert und löst beim Start einmalig die vorhandenen Background-Jobs
aus (Price-Alert-Scan, Katalog-Import, Analytics, Healthcheck,
Marketplace). Ohne `SCHEDULER_ENABLED=true` beendet sich der Prozess sofort,
ohne etwas auszulösen (Produktions-Default: deaktiviert). Kein eingebauter
Cron – ein externer Scheduler (z. B. Cron-Job/Cloud Scheduler) muss den
Prozess in der gewünschten Frequenz erneut starten.

## Stripe

- Checkout: `services/stripe/createCheckoutSession.ts`
- Webhook (Signaturprüfung + Dispatch): `app/api/stripe/webhook/route.ts`
- Erfolgs-/Abbruchseite: `app/checkout/success`, `app/checkout/cancel`

Lokal Webhook-Events weiterleiten:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Das dabei ausgegebene `whsec_...`-Secret in `STRIPE_WEBHOOK_SECRET`
eintragen. In Produktion wird das Secret im Stripe-Dashboard beim Anlegen
des Live-Webhook-Endpunkts vergeben.

## Monitoring-Vorbereitung

Kein Monitoring-System ist installiert (bewusst, siehe Feature 80 – "kein
neues Monitoring-System"). Vorhandene Ansatzpunkte für eine spätere
Integration (z. B. Sentry/Datadog/OpenTelemetry):

- Strukturierte Logs mit konsistenten `[kategorie]`-Präfixen für alle
  Queue-/Scheduler-/Realtime-Vorgänge (`[jobs:*]`, `[scheduler]`,
  `[orders]`, `[messages]`, `[auth]`) – leicht per Log-Aggregator zu filtern.
- Fehlerpfade in Server Actions/Services unterscheiden konsequent zwischen
  erwarteten Domain-Fehlern (eigene Error-Klassen, z. B.
  `ListingNotFoundError`) und unerwarteten Fehlern (werden ungefangen
  weitergereicht, landen in den Server-Logs mit vollem Stacktrace, dem
  Client wird nur eine generische Next.js-Fehlermeldung angezeigt).
- Der Stripe-Webhook-Endpunkt (`app/api/stripe/webhook/route.ts`) sowie die
  Queue-Timeout-Fehlerpfade (siehe oben) sind die naheliegendsten Stellen für
  Alerting, sobald ein Monitoring-System angebunden wird.
