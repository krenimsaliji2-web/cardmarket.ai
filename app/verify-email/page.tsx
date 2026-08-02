import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "E-Mail bestätigen – Project Atlas",
  description: "Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.",
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Bestätige deine E-Mail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dein Konto wurde erstellt. Bitte bestätige deine E-Mail-Adresse
            über den Link, den wir dir geschickt haben, um dein Konto zu
            aktivieren.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
