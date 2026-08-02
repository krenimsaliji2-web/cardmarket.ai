import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Der Benutzername muss mindestens 3 Zeichen lang sein.")
      .max(30, "Der Benutzername darf maximal 30 Zeichen lang sein.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Nur Buchstaben, Zahlen und Unterstriche sind erlaubt.",
      ),
    email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein."),
    password: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value === true, {
      message: "Du musst die AGB akzeptieren.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
