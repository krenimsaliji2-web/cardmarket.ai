import { z } from "zod";

export const shippingAddressSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Bitte gib deinen Vornamen an.")
    .max(60, "Der Vorname darf maximal 60 Zeichen lang sein."),
  lastName: z
    .string()
    .trim()
    .min(1, "Bitte gib deinen Nachnamen an.")
    .max(60, "Der Nachname darf maximal 60 Zeichen lang sein."),
  street: z
    .string()
    .trim()
    .min(1, "Bitte gib deine Straße an.")
    .max(120, "Die Straße darf maximal 120 Zeichen lang sein."),
  postalCode: z
    .string()
    .trim()
    .min(1, "Bitte gib deine PLZ an.")
    .max(12, "Die PLZ darf maximal 12 Zeichen lang sein."),
  city: z
    .string()
    .trim()
    .min(1, "Bitte gib deinen Ort an.")
    .max(80, "Der Ort darf maximal 80 Zeichen lang sein."),
  country: z
    .string()
    .trim()
    .min(1, "Bitte gib dein Land an.")
    .max(60, "Das Land darf maximal 60 Zeichen lang sein."),
  phone: z
    .string()
    .trim()
    .max(30, "Die Telefonnummer darf maximal 30 Zeichen lang sein.")
    .optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
