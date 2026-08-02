import { z } from "zod";

import { CONDITIONS, LANGUAGES } from "./listing";

/**
 * Feature 77 – Favoriten: sinnvoller Standard-Zustand für Herzsymbole ohne
 * konkreten Listing-Kontext (z. B. Kartendetailseiten, wo keine Sprache/kein
 * Zustand eines spezifischen Angebots vorliegt) – dieselbe Konvention, die
 * zuvor addToWishlistAction() intern für /catalog/card/[id] verwendet hat.
 * Sprache kommt in diesen Fällen von der jeweiligen Karte selbst
 * (`card.language`), nicht von hier. Bewusst NICHT in actions.ts ("use
 * server"-Dateien dürfen ausschließlich async Functions exportieren).
 */
export const DEFAULT_FAVORITE_CONDITION = "Near Mint";

export const updateWishlistItemSchema = z.object({
  language: z.enum(LANGUAGES, "Bitte wähle eine gültige Sprache aus."),
  condition: z.enum(CONDITIONS, "Bitte wähle einen gültigen Zustand aus."),
  foil: z.boolean(),
  targetPrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Bitte gib einen gültigen Preis ein (z. B. 12.50).")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Die Notiz darf maximal 1000 Zeichen lang sein.")
    .optional(),
});

export type UpdateWishlistItemInput = z.infer<typeof updateWishlistItemSchema>;
