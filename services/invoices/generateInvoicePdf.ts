import PDFDocument from "pdfkit";

import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";

export interface InvoiceItemInput {
  cardName: string;
  sellerName: string;
  quantity: number;
  price: string;
  subtotal: string;
}

export interface InvoiceInput {
  invoiceNumber: string;
  orderId: string;
  invoiceDate: Date;
  buyerName: string;
  buyerEmail: string;
  currency: string;
  totalPrice: string;
  items: InvoiceItemInput[];
}

const COLUMNS = { card: 50, seller: 220, qty: 350, price: 400, subtotal: 470 };
const PAGE_RIGHT_EDGE = 545;

/**
 * Rendert eine A4-PDF-Rechnung ausschließlich aus den übergebenen Daten –
 * keine Datenbankzugriffe hier. Einziger Ort im Projekt mit PDF-Layout-Code;
 * services/invoices/createInvoice.ts lädt die Order-Daten und ruft diese
 * Funktion auf, ohne selbst etwas über PDF-Rendering zu wissen.
 */
export function generateInvoicePdf(input: InvoiceInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).fillColor("#000").text("Project Atlas");
    doc.fontSize(10).fillColor("#555").text("Rechnung");
    doc.moveDown(1.5);

    doc.fillColor("#000").fontSize(11);
    doc.text(`Rechnungsnummer: ${input.invoiceNumber}`);
    doc.text(`Bestellnummer: ${input.orderId}`);
    doc.text(`Rechnungsdatum: ${formatDate(input.invoiceDate)}`);
    doc.moveDown();

    doc.text("Käufer:");
    doc.text(input.buyerName);
    doc.text(input.buyerEmail);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    doc.fontSize(9).fillColor("#555");
    doc.text("Karte", COLUMNS.card, tableTop, { width: COLUMNS.seller - COLUMNS.card - 10 });
    doc.text("Verkäufer", COLUMNS.seller, tableTop, { width: COLUMNS.qty - COLUMNS.seller - 10 });
    doc.text("Menge", COLUMNS.qty, tableTop, { width: COLUMNS.price - COLUMNS.qty - 10 });
    doc.text("Einzelpreis", COLUMNS.price, tableTop, { width: COLUMNS.subtotal - COLUMNS.price - 10 });
    doc.text("Zwischensumme", COLUMNS.subtotal, tableTop, {
      width: PAGE_RIGHT_EDGE - COLUMNS.subtotal,
    });
    doc
      .moveTo(50, tableTop + 14)
      .lineTo(PAGE_RIGHT_EDGE, tableTop + 14)
      .strokeColor("#ccc")
      .stroke();

    let y = tableTop + 20;
    doc.fontSize(10).fillColor("#000");
    for (const item of input.items) {
      doc.text(item.cardName, COLUMNS.card, y, { width: COLUMNS.seller - COLUMNS.card - 10 });
      doc.text(item.sellerName, COLUMNS.seller, y, { width: COLUMNS.qty - COLUMNS.seller - 10 });
      doc.text(String(item.quantity), COLUMNS.qty, y, { width: COLUMNS.price - COLUMNS.qty - 10 });
      doc.text(formatCurrency(item.price, input.currency), COLUMNS.price, y, {
        width: COLUMNS.subtotal - COLUMNS.price - 10,
      });
      doc.text(formatCurrency(item.subtotal, input.currency), COLUMNS.subtotal, y, {
        width: PAGE_RIGHT_EDGE - COLUMNS.subtotal,
      });
      y += 20;
    }

    doc.moveTo(50, y + 4).lineTo(PAGE_RIGHT_EDGE, y + 4).strokeColor("#000").stroke();
    doc
      .fontSize(12)
      .text(`Gesamtsumme: ${formatCurrency(input.totalPrice, input.currency)}`, COLUMNS.card, y + 14, {
        width: PAGE_RIGHT_EDGE - COLUMNS.card,
        align: "right",
      });

    doc.end();
  });
}

function formatCurrency(value: string, currency: string): string {
  return `${formatPrice(value)} ${currency.toUpperCase()}`;
}
