/** Rohdatei, wie sie zum Speichern übergeben wird (Provider-unabhängig). */
export interface StorageFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

/** Ergebnis einer erfolgreichen Speicherung. */
export interface StoredFile {
  /** Öffentlich erreichbare URL bzw. Pfad der gespeicherten Datei. */
  url: string;
}

/**
 * Abstraktion über den tatsächlichen Speicherort von Dateien (lokal,
 * Cloudflare R2, S3, ...). Business-Logik hängt ausschließlich von diesem
 * Interface ab, nie von einer konkreten Implementierung – dadurch lässt
 * sich der Speicherort später austauschen, ohne Aufrufer anzupassen.
 */
export interface StorageProvider {
  save(file: StorageFile): Promise<StoredFile>;
  /** Löscht eine zuvor gespeicherte Datei anhand ihrer URL. Muss idempotent
   * sein (kein Fehler, falls die Datei bereits nicht mehr existiert). */
  delete(url: string): Promise<void>;
}
