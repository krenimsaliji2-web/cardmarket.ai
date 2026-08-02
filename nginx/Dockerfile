# Project Atlas – nginx-Image (Feature 86).
# Erweitert ausschließlich das offizielle nginx-Image um den
# Bootstrap-Wrapper für das Platzhalter-TLS-Zertifikat (siehe
# docker-entrypoint-wrapper.sh) – keine eigene nginx-Distribution, kein
# zusätzlicher Container.
FROM nginx:1.27-alpine

COPY docker-entrypoint-wrapper.sh /docker-entrypoint-wrapper.sh
RUN chmod +x /docker-entrypoint-wrapper.sh

ENTRYPOINT ["/docker-entrypoint-wrapper.sh"]
CMD ["nginx", "-g", "daemon off;"]
