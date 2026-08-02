import { LocalStorageProvider } from "./LocalStorageProvider";
import type { StorageProvider } from "./StorageProvider";

export type { StorageFile, StorageProvider, StoredFile } from "./StorageProvider";

/**
 * Einzige Stelle, an der eine konkrete StorageProvider-Implementierung
 * ausgewählt wird. Aufrufer (Server Actions, Services) kennen ausschließlich
 * das StorageProvider-Interface und erhalten die Instanz per Dependency
 * Injection – ein Wechsel auf z. B. Cloudflare R2 betrifft künftig nur
 * diese eine Funktion.
 */
export function createStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}
