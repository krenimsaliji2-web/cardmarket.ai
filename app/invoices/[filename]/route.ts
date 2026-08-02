import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const INVOICES_DIR = path.join(process.cwd(), "public", "invoices");

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/**
 * Liefert von createInvoice() (services/invoices/createInvoice.ts)
 * gespeicherte Rechnungs-PDFs aus. Next.js' statisches Serving von
 * `public/` snapshotet das Verzeichnis beim Start des Produktionsservers
 * (next start) – zur Laufzeit neu erstellte Rechnungen lieferten dadurch
 * bis zum nächsten Neustart einen 404, obwohl sie bereits auf der Platte
 * lagen (identisches Problem wie bei den Listing-Uploads, siehe
 * app/uploads/listings/[filename]/route.ts). Dieser Route Handler liest
 * stattdessen bei jedem Request direkt von der Platte – exakt dieselbe
 * URL-Struktur, keine Änderung an createInvoice() nötig.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { filename } = await params;

  // path.basename() verhindert Path Traversal (z. B. "../../.env").
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename || path.extname(safeFilename).toLowerCase() !== ".pdf") {
    return NextResponse.json({ error: "Ungültiger Dateiname." }, { status: 400 });
  }

  const filePath = path.join(INVOICES_DIR, safeFilename);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    const isMissingFile = error instanceof Error && "code" in error && error.code === "ENOENT";
    if (isMissingFile) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }
    throw error;
  }
}
