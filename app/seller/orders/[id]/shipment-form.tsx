"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ShippingCarrier } from "@/prisma/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { markDeliveredAction, updateShipmentAction } from "./actions";

const CARRIER_OPTIONS: { value: ShippingCarrier; label: string }[] = [
  { value: "SWISS_POST", label: "Swiss Post" },
  { value: "DHL", label: "DHL" },
  { value: "UPS", label: "UPS" },
  { value: "FEDEX", label: "FedEx" },
  { value: "DPD", label: "DPD" },
  { value: "GLS", label: "GLS" },
  { value: "OTHER", label: "Andere" },
];

interface ShipmentFormProps {
  orderId: string;
  orderItemId: string;
  initialCarrier: ShippingCarrier | null;
  initialTrackingNumber: string | null;
  isShipped: boolean;
  isDelivered: boolean;
}

export function ShipmentForm({
  orderId,
  orderItemId,
  initialCarrier,
  initialTrackingNumber,
  isShipped,
  isDelivered,
}: ShipmentFormProps) {
  const router = useRouter();
  const [carrier, setCarrier] = useState<ShippingCarrier>(initialCarrier ?? "SWISS_POST");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmitShipment() {
    setError(null);
    startTransition(async () => {
      const result = await updateShipmentAction(orderId, orderItemId, carrier, trackingNumber);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Speichern.");
        return;
      }
      router.refresh();
    });
  }

  function handleMarkDelivered() {
    setError(null);
    startTransition(async () => {
      const result = await markDeliveredAction(orderId, orderItemId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Markieren.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Versanddienst</Label>
          <Select value={carrier} onValueChange={(value) => setCarrier(value as ShippingCarrier)}>
            <SelectTrigger className="w-full" disabled={isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARRIER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`tracking-${orderItemId}`}>Trackingnummer</Label>
          <Input
            id={`tracking-${orderItemId}`}
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            maxLength={100}
            disabled={isPending}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending || trackingNumber.trim().length === 0}
          onClick={handleSubmitShipment}
        >
          {isPending ? "Wird gespeichert…" : isShipped ? "Versanddaten aktualisieren" : "Als versendet markieren"}
        </Button>
        {isShipped && !isDelivered && (
          <Button type="button" variant="outline" disabled={isPending} onClick={handleMarkDelivered}>
            Als geliefert markieren
          </Button>
        )}
      </div>
    </div>
  );
}
