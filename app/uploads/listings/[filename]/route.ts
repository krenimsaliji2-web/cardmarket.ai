import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "listings");

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/**
 * Liefert von LocalStorageProvider (services/storage/LocalStorageProvider.ts)
 * gespeicherte Listing-Bilder aus. Next.js' statisches Serving von
 * `public/` snapshotet das Verzeichnis beim Start des Produktionsservers
 * (next start) – zur Laufzeit neu hochgeladene Dateien lieferten dadurch
 * bis zum nächsten Neustart einen 404, obwohl sie bereits auf der Platte
 * lagen (in einem frischen, unveränderten Produktions-Build reproduziert).
 * Dieser Route Handler liest stattdessen bei jedem Request direkt von der
 * Platte – exakt derselbe Pfad, dieselbe URL-Struktur, keine Änderung an
 * LocalStorageProvider oder den in der DB gespeicherten URLs nötig.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { filename } = await params;

  // path.basename() verhindert Path Traversal (z. B. "../../.env").
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) {
    return NextResponse.json({ error: "Ungültiger Dateiname." }, { status: 400 });
  }

  const extension = path.extname(safeFilename).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return NextResponse.json({ error: "Ungültiger Dateityp." }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, safeFilename);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
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
