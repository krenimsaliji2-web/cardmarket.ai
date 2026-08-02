import { z } from "zod";

export const createSellerProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, "Der Anzeigename muss mindestens 3 Zeichen lang sein.")
    .max(40, "Der Anzeigename darf maximal 40 Zeichen lang sein."),
  country: z.string().trim().min(1, "Bitte gib ein Land an."),
  bio: z
    .string()
    .trim()
    .max(500, "Die Bio darf maximal 500 Zeichen lang sein.")
    .optional(),
});

export type CreateSellerProfileInput = z.infer<typeof createSellerProfileSchema>;

const MAX_SHIPPING_COUNTRIES = 30;

/** Optionales Textfeld – leerer String wird zu `undefined` statt einen Pflichtfehler auszulösen. */
function optionalText(maxLength: number, message: string) {
  return z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .or(z.literal("").transform(() => undefined));
}

/** Optionale URL – leerer String wird zu `undefined`, ein befüllter Wert muss eine gültige URL sein. */
function optionalUrl(message: string) {
  return z
    .string()
    .trim()
    .max(300, "Die URL darf maximal 300 Zeichen lang sein.")
    .url(message)
    .optional()
    .or(z.literal("").transform(() => undefined));
}

export const updateSellerProfileSchema = z.object({
  shortDescription: optionalText(200, "Die Kurzbeschreibung darf maximal 200 Zeichen lang sein."),
  longDescription: optionalText(3000, "Die lange Beschreibung darf maximal 3000 Zeichen lang sein."),
  companyName: optionalText(100, "Der Firmenname darf maximal 100 Zeichen lang sein."),
  website: optionalUrl("Bitte gib eine gültige Website-URL an."),
  instagramUrl: optionalUrl("Bitte gib eine gültige Instagram-URL an."),
  facebookUrl: optionalUrl("Bitte gib eine gültige Facebook-URL an."),
  youtubeUrl: optionalUrl("Bitte gib eine gültige YouTube-URL an."),
  discordUrl: optionalUrl("Bitte gib eine gültige Discord-URL an."),
  location: optionalText(100, "Der Standort darf maximal 100 Zeichen lang sein."),
  shippingCountries: z
    .array(z.string().trim().min(1).max(60))
    .max(MAX_SHIPPING_COUNTRIES, `Maximal ${MAX_SHIPPING_COUNTRIES} Versandländer erlaubt.`),
  shippingTime: optionalText(100, "Die Versandzeit darf maximal 100 Zeichen lang sein."),
  responseTime: optionalText(100, "Die Antwortzeit darf maximal 100 Zeichen lang sein."),
  shopRules: optionalText(2000, "Die Shop-Regeln dürfen maximal 2000 Zeichen lang sein."),
  returnPolicy: optionalText(2000, "Die Rückgabebedingungen dürfen maximal 2000 Zeichen lang sein."),
});

export type UpdateSellerProfileFormInput = z.infer<typeof updateSellerProfileSchema>;
