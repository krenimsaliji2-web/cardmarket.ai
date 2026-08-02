import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
