import { z } from "zod";

export const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Excellent",
  "Good",
  "Played",
  "Poor",
] as const;

export const LANGUAGES = [
  "Deutsch",
  "Englisch",
  "Französisch",
  "Italienisch",
  "Spanisch",
  "Japanisch",
  "Koreanisch",
  "Chinesisch",
] as const;

export const createListingSchema = z.object({
  cardId: z.string().min(1, "Bitte wähle eine Karte aus."),
  // Preis bleibt als String erhalten (kein Number-Coercion), damit keine
  // Floating-Point-Ungenauigkeit bei Geldbeträgen entsteht – Prisma nimmt
  // Strings für Decimal-Felder direkt entgegen.
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Bitte gib einen gültigen Preis ein (z. B. 19.99).")
    .refine((value) => Number(value) > 0, {
      message: "Der Preis muss größer als 0 sein.",
    }),
  quantity: z.coerce
    .number()
    .int("Die Anzahl muss eine ganze Zahl sein.")
    .min(1, "Die Anzahl muss mindestens 1 sein."),
  language: z.enum(LANGUAGES, "Bitte wähle eine gültige Sprache aus."),
  condition: z.enum(CONDITIONS, "Bitte wähle einen gültigen Zustand aus."),
  isFoil: z.boolean(),
  isSigned: z.boolean(),
  description: z
    .string()
    .trim()
    .max(1000, "Die Beschreibung darf maximal 1000 Zeichen lang sein.")
    .optional(),
  // Feature 72 – kein fester Wertebereich (anders als language/condition),
  // daher Freitext statt z.enum.
  edition: z
    .string()
    .trim()
    .max(100, "Die Edition darf maximal 100 Zeichen lang sein.")
    .optional(),
  isFirstEdition: z.boolean(),
  grading: z
    .string()
    .trim()
    .max(100, "Das Grading darf maximal 100 Zeichen lang sein.")
    .optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// Beim Bearbeiten darf die Karte nicht geändert werden – dieselben
// Feldregeln wie beim Erstellen, nur ohne cardId. Leitet bewusst von
// createListingSchema ab, statt die Regeln zu duplizieren.
export const updateListingSchema = createListingSchema.omit({ cardId: true });

export type UpdateListingInput = z.infer<typeof updateListingSchema>;
