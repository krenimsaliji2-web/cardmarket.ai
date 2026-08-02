import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Zahlung abgebrochen – Project Atlas",
};

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="items-center text-center">
          <XCircle className="size-12 text-muted-foreground" />
          <CardTitle className="text-2xl">Zahlung abgebrochen</CardTitle>
          <CardDescription>
            Der Bezahlvorgang wurde abgebrochen. Es wurde nichts berechnet – dein Warenkorb ist weiterhin verfügbar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/cart">Zurück zum Warenkorb</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/marketplace">Weiter einkaufen</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
