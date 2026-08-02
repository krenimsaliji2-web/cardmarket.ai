import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageFile, StorageProvider, StoredFile } from "./StorageProvider";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "listings");
const PUBLIC_URL_PREFIX = "/uploads/listings";

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Speichert Dateien lokal unter public/uploads/listings, damit Next.js sie
 * direkt als statische Datei ausliefert (kein eigener Serving-Endpunkt
 * nötig). Nur für Entwicklung/MVP gedacht – überlebt keine Neu-Deploys auf
 * Plattformen mit ephemeren Dateisystemen. Wird später 1:1 durch z. B.
 * einen CloudflareR2StorageProvider ersetzt, der dasselbe StorageProvider-
 * Interface implementiert.
 */
export class LocalStorageProvider implements StorageProvider {
  async save(file: StorageFile): Promise<StoredFile> {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const extension = EXTENSION_BY_CONTENT_TYPE[file.contentType] ?? ".bin";
    const filename = `${randomUUID()}${extension}`;

    await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

    return { url: `${PUBLIC_URL_PREFIX}/${filename}` };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith(`${PUBLIC_URL_PREFIX}/`)) {
      return;
    }

    const filename = path.basename(url.slice(`${PUBLIC_URL_PREFIX}/`.length));
    try {
      await unlink(path.join(UPLOAD_DIR, filename));
    } catch (error) {
      const isMissingFile =
        error instanceof Error && "code" in error && error.code === "ENOENT";
      if (!isMissingFile) {
        throw error;
      }
    }
  }
}
