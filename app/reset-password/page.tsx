import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Passwort zurücksetzen – Project Atlas",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Neues Passwort vergeben</CardTitle>
          {!token && (
            <CardDescription>
              Dieser Link ist ungültig oder unvollständig. Bitte fordere einen neuen Link über{" "}
              <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
                Passwort vergessen
              </Link>{" "}
              an.
            </CardDescription>
          )}
        </CardHeader>
        {token && (
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        )}
      </Card>
    </main>
  );
}
