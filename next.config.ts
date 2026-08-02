import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lädt seine Standard-Fonts (Helvetica.afm) zur Laufzeit über einen
  // __dirname-relativen Pfad (services/invoices/generateInvoicePdf.ts). Wird
  // pdfkit durch Turbopack/webpack ins Server-Bundle gezogen, wird dieser
  // Pfad auf einen nicht existierenden Ort verfälscht ("C:\ROOT\..." statt
  // dem echten node_modules-Pfad) – die Rechnungserstellung crasht dann mit
  // ENOENT, was den gesamten Stripe-Webhook (createOrder) mit 500 abbrechen
  // lässt. serverExternalPackages lädt pdfkit stattdessen unverändert über
  // Node require(), wodurch die __dirname-Auflösung korrekt bleibt.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
