import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";

import { generateInvoicePdf } from "./generateInvoicePdf";

export interface CreateInvoiceResult {
  invoiceNumber: string;
  filePath: string;
}

const INVOICES_DIR = path.join(process.cwd(), "public", "invoices");

/**
 * Erstellt aus einer bestehenden Order eine PDF-Rechnung und speichert sie
 * lokal unter public/invoices/. Nutzt ausschließlich bereits vorhandene
 * Order-/OrderItem-/User-Daten (Snapshot aus Feature 29) – keine neue
 * DB-Tabelle, keine Änderung am Order-Modell.
 *
 * Die Rechnungsnummer und der Dateiname basieren auf der bereits
 * eindeutigen Order-ID (cuid) und sind damit automatisch eindeutig, ohne
 * einen eigenen Zähler/eine eigene Tabelle zu benötigen.
 */
export async function createInvoice(orderId: string): Promise<CreateInvoiceResult> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      user: { select: { name: true, email: true } },
    },
  });

  const invoiceNumber = `RE-${order.id}`;

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    orderId: order.id,
    invoiceDate: order.createdAt,
    buyerName: order.user.name,
    buyerEmail: order.user.email,
    currency: order.currency,
    totalPrice: order.totalPrice.toFixed(2),
    items: order.items.map((item) => ({
      cardName: item.cardName,
      sellerName: item.sellerName,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  });

  await fs.mkdir(INVOICES_DIR, { recursive: true });

  const filename = `invoice-${order.id}.pdf`;
  await fs.writeFile(path.join(INVOICES_DIR, filename), pdfBuffer);

  return { invoiceNumber, filePath: `/invoices/${filename}` };
}
