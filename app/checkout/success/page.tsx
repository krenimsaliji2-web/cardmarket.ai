import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export const metadata: Metadata = {
  title: "Zahlung erfolgreich – Project Atlas",
};

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { session_id: sessionId } = await searchParams;

  // Der Webhook (app/api/stripe/webhook/route.ts -> createOrder()) legt die
  // Order asynchron an – zum Zeitpunkt dieses Redirects kann sie noch nicht
  // existieren (bekanntes Stripe-Race zwischen Browser-Redirect und
  // Webhook-Zustellung, keine Garantie welches zuerst eintrifft). Existiert
  // sie bereits, wird direkt darauf verlinkt; andernfalls eine ebenso
  // korrekte, generische Bestätigung angezeigt (Ownership-geprüft: nur die
  // eigene Order, kein Erraten fremder Bestellungen über session_id).
  const order = sessionId
    ? await prisma.order.findFirst({
        where: { stripeCheckoutSessionId: sessionId, userId: session.user.id },
        select: { id: true },
      })
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="size-12 text-green-600" />
          <CardTitle className="text-2xl">Zahlung erfolgreich</CardTitle>
          <CardDescription>
            {order
              ? "Vielen Dank für deinen Einkauf! Deine Bestellung wurde erstellt."
              : "Vielen Dank für deinen Einkauf! Deine Bestellung wird gerade verarbeitet und erscheint in Kürze in deiner Bestellübersicht."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={order ? `/orders/${order.id}` : "/orders"}>
              {order ? "Bestellung ansehen" : "Meine Bestellungen"}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/marketplace">Weiter einkaufen</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
