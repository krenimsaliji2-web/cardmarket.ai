"use client";

import { useActionState } from "react";

import type { CartResult } from "@/services/cart/getCart";
import { formatPrice } from "@/utils/formatPrice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createCheckoutAction, type CheckoutFormState } from "./actions";

const initialState: CheckoutFormState = { errors: {} };

interface CheckoutFormProps {
  cart: CartResult;
}

export function CheckoutForm({ cart }: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(createCheckoutAction, initialState);

  // Preis-Snapshot des aktuell angezeigten Warenkorbs – wird serverseitig
  // gegen die Live-Preise geprüft (siehe validateCart.ts).
  const priceSnapshot = JSON.stringify(
    cart.items.map((item) => ({ cartItemId: item.id, expectedPrice: item.price })),
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
      <input type="hidden" name="priceSnapshot" value={priceSnapshot} />

      <Card>
        <CardHeader>
          <CardTitle>Lieferadresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                disabled={isPending}
                aria-invalid={!!state.errors.firstName}
              />
              {state.errors.firstName && (
                <p className="text-sm text-destructive">{state.errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                disabled={isPending}
                aria-invalid={!!state.errors.lastName}
              />
              {state.errors.lastName && (
                <p className="text-sm text-destructive">{state.errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Straße</Label>
            <Input
              id="street"
              name="street"
              required
              disabled={isPending}
              aria-invalid={!!state.errors.street}
            />
            {state.errors.street && (
              <p className="text-sm text-destructive">{state.errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">PLZ</Label>
              <Input
                id="postalCode"
                name="postalCode"
                required
                disabled={isPending}
                aria-invalid={!!state.errors.postalCode}
              />
              {state.errors.postalCode && (
                <p className="text-sm text-destructive">{state.errors.postalCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ort</Label>
              <Input
                id="city"
                name="city"
                required
                disabled={isPending}
                aria-invalid={!!state.errors.city}
              />
              {state.errors.city && (
                <p className="text-sm text-destructive">{state.errors.city}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input
              id="country"
              name="country"
              required
              disabled={isPending}
              aria-invalid={!!state.errors.country}
            />
            {state.errors.country && (
              <p className="text-sm text-destructive">{state.errors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              disabled={isPending}
              aria-invalid={!!state.errors.phone}
            />
            {state.errors.phone && (
              <p className="text-sm text-destructive">{state.errors.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Bestellübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 truncate">
                  {item.cardName} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 border-t pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zwischensumme</span>
              <span>{formatPrice(cart.totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Versand</span>
              <span>{formatPrice("0.00")}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Gesamtsumme</span>
              <span>{formatPrice(cart.totalPrice)}</span>
            </div>
          </div>

          {state.errors.cart && (
            <p className="text-sm text-destructive">{state.errors.cart}</p>
          )}

          {/* Erstellt bei Erfolg eine echte Stripe Checkout Session und
              leitet dorthin weiter (redirect() in actions.ts) – es wird
              dabei keine Order angelegt und keine Zahlung bestätigt. */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wird weitergeleitet…" : "Jetzt bezahlen"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
