import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SellerProfileForm } from "./seller-profile-form";

export const metadata: Metadata = {
  title: "Verkäufer werden – Project Atlas",
};

export default async function NewSellerProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    redirect("/seller");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verkäufer werden</CardTitle>
          <CardDescription>
            Lege dein Verkäuferprofil an, um Karten anbieten zu können.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SellerProfileForm />
        </CardContent>
      </Card>
    </main>
  );
}
