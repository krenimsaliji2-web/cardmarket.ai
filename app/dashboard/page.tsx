import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard – Project Atlas",
};

export default async function DashboardPage() {
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession) {
    redirect("/login");
  }

  const { user } = authSession;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Willkommen zurück, {user.username}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">E-Mail</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Rolle</dt>
              <dd className="font-medium">{user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Benutzer-ID</dt>
              <dd className="break-all font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
