import { prisma } from "@/lib/prisma";
import type { ShippingCarrier } from "@/prisma/generated/prisma/client";

import { getTrackingUrl } from "./getTrackingUrl";

export interface UpdateShipmentInput {
  carrier: ShippingCarrier;
  trackingNumber: string;
}

export type UpdateShipmentResult =
  | { status: "updated"; trackingUrl: string | null; shippedAt: Date }
  | { status: "not_found" };

/**
 * Speichert Versanddienst + Trackingnummer für EINE Bestellposition
 * (OrderItem) und erzeugt die passende Tracking-URL (getTrackingUrl.ts).
 * Dient gleichzeitig als "Versendet"-Aktion: `shippedAt` wird beim ersten
 * erfolgreichen Speichern gesetzt und danach nicht mehr verändert – ein
 * späteres Korrigieren von Carrier/Trackingnummer (Test "Carrier
 * wechseln") darf das ursprüngliche Versanddatum nicht verschieben.
 *
 * Ownership: Es wird ausschließlich über das SellerProfile des
 * aufrufenden Users gesucht (`sellerId` aus der Session, nie vom
 * Client) – "existiert nicht" und "gehört einem anderen Verkäufer"
 * kollabieren beide zu `not_found`, kein Informationsleck.
 */
export async function updateShipment(
  userId: string,
  orderItemId: string,
  input: UpdateShipmentInput,
): Promise<UpdateShipmentResult> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!sellerProfile) {
    return { status: "not_found" };
  }

  const existing = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId: sellerProfile.id },
    select: { shippedAt: true },
  });

  if (!existing) {
    return { status: "not_found" };
  }

  const trackingUrl = getTrackingUrl(input.carrier, input.trackingNumber);
  const shippedAt = existing.shippedAt ?? new Date();

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      shippingCarrier: input.carrier,
      trackingNumber: input.trackingNumber,
      trackingUrl,
      shippedAt,
    },
    select: { shippedAt: true },
  });

  return { status: "updated", trackingUrl, shippedAt: updated.shippedAt! };
}
