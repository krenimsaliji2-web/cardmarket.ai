#!/bin/sh
# Project Atlas – nginx-Entrypoint-Wrapper (Feature 86).
#
# Löst das Henne-Ei-Problem bei Erstinstallation: der HTTPS-Server-Block
# (nginx/templates/app.conf.template) verweist immer auf
# /etc/letsencrypt/live/${DOMAIN}/... – existiert dort noch kein
# Zertifikat (allererster `docker compose up -d` auf einem neuen Server,
# bevor certbot je gelaufen ist), würde nginx mit einem Konfigurationsfehler
# abbrechen. Damit "git clone, .env anlegen, docker compose up -d" wie
# gefordert sofort funktioniert, wird hier – NUR falls noch kein Zertifikat
# existiert – ein selbstsigniertes Platzhalter-Zertifikat exakt an der
# Stelle erzeugt, an der certbot später das echte Zertifikat ablegt. Der
# Browser zeigt bis zum echten Let's-Encrypt-Bezug (siehe README "HTTPS")
# eine Zertifikatswarnung, die App läuft aber sofort über HTTPS.
set -e

if [ -z "$DOMAIN" ]; then
  echo "[nginx-entrypoint] FEHLER: Umgebungsvariable DOMAIN ist nicht gesetzt." >&2
  exit 1
fi

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [ ! -f "${CERT_DIR}/fullchain.pem" ] || [ ! -f "${CERT_DIR}/privkey.pem" ]; then
  echo "[nginx-entrypoint] Kein Zertifikat für ${DOMAIN} gefunden – erzeuge selbstsigniertes Platzhalter-Zertifikat."
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN}"
  echo "[nginx-entrypoint] Platzhalter-Zertifikat erzeugt. Echtes Let's-Encrypt-Zertifikat siehe README 'HTTPS'."
else
  echo "[nginx-entrypoint] Zertifikat für ${DOMAIN} bereits vorhanden, wird verwendet."
fi

exec /docker-entrypoint.sh "$@"
