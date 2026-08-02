import { z } from "zod";

export const MAX_IMAGES = 10;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const listingImageFileSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
    { message: "Nur JPG, JPEG, PNG oder WEBP sind erlaubt." },
  )
  .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, {
    message: "Jedes Bild darf maximal 10 MB groß sein.",
  });

/** Für die Erstellung: alle Bilder sind neu, mindestens 1 ist Pflicht. */
export const listingImagesSchema = z
  .array(listingImageFileSchema)
  .min(1, "Bitte lade mindestens ein Bild hoch.")
  .max(MAX_IMAGES, `Maximal ${MAX_IMAGES} Bilder erlaubt.`);

/**
 * Für die Bearbeitung: die neu hinzugefügten Dateien allein dürfen auch 0
 * sein (z. B. wenn nur vorhandene Bilder umsortiert/entfernt werden). Die
 * Gesamt-Obergrenze wird stattdessen über imageOrderSchema geprüft, da sie
 * sich auf bestehende + neue Bilder zusammen bezieht.
 */
export const newListingImagesSchema = z
  .array(listingImageFileSchema)
  .max(MAX_IMAGES, `Maximal ${MAX_IMAGES} Bilder erlaubt.`);

/** Beschreibt die finale, vom Nutzer festgelegte Reihenfolge aus bestehenden und neuen Bildern. */
export const imageOrderEntrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("existing"), id: z.string().min(1) }),
  z.object({ type: z.literal("new"), index: z.number().int().min(0) }),
]);

export const imageOrderSchema = z
  .array(imageOrderEntrySchema)
  .min(1, "Es muss mindestens ein Bild vorhanden sein.")
  .max(MAX_IMAGES, `Maximal ${MAX_IMAGES} Bilder erlaubt.`);

export type ImageOrderEntry = z.infer<typeof imageOrderEntrySchema>;

/** Für die eigenständige Reorder-Aktion (nur bestehende Bild-IDs, keine neuen Dateien). */
export const reorderImageIdsSchema = z
  .array(z.string().min(1))
  .min(1, "Es muss mindestens ein Bild vorhanden sein.")
  .max(MAX_IMAGES, `Maximal ${MAX_IMAGES} Bilder erlaubt.`);
