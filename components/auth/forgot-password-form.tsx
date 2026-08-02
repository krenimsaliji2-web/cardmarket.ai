"use client";

import { useState, useTransition, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/forgotPassword";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<Record<keyof ForgotPasswordFormValues, string>>;

const initialValues: ForgotPasswordFormValues = { email: "" };

export function ForgotPasswordForm() {
  const [values, setValues] = useState<ForgotPasswordFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = forgotPasswordSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ForgotPasswordFormValues;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: result.data.email,
        redirectTo: "/reset-password",
      });

      // Bewusst KEIN unterschiedliches Verhalten bei "E-Mail existiert
      // nicht" vs. "E-Mail existiert" (User Enumeration vermeiden) – nur
      // echte Request-Fehler (z. B. Rate Limit) werden angezeigt.
      if (error) {
        setFormError(error.message ?? "Etwas ist schiefgelaufen. Bitte versuche es erneut.");
        return;
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">
        Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum
        Zurücksetzen deines Passworts geschickt.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => {
            setValues({ email: event.target.value });
            setErrors({});
          }}
          aria-invalid={!!errors.email}
          disabled={isPending}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Wird gesendet…" : "Link zum Zurücksetzen senden"}
      </Button>
    </form>
  );
}
