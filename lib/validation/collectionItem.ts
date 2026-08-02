import { z } from "zod";

import { CONDITIONS, LANGUAGES } from "./listing";

export const updateCollectionItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Die Menge muss eine ganze Zahl sein.")
    .min(1, "Die Menge muss mindestens 1 sein."),
  language: z.enum(LANGUAGES, "Bitte wähle eine gültige Sprache aus."),
  condition: z.enum(CONDITIONS, "Bitte wähle einen gültigen Zustand aus."),
  foil: z.boolean(),
  purchasePrice: z
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

export type UpdateCollectionItemInput = z.infer<typeof updateCollectionItemSchema>;
