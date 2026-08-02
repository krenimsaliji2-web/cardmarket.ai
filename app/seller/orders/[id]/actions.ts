"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { ShippingCarrier } from "@/prisma/generated/prisma/client";
import { markDelivered } from "@/services/shipping/markDelivered";
import { updateShipment } from "@/services/shipping/updateShipment";

export interface ShipmentActionResult {
  success: boolean;
  error?: string;
}

const VALID_CARRIERS: ShippingCarrier[] = ["SWISS_POST", "DHL", "UPS", "FEDEX", "DPD", "GLS", "OTHER"];

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

/**
 * `sellerId`/`userId` kommen ausschließlich aus der Server-Session – nur
 * der eingeloggte Verkäufer darf über updateShipment()/markDelivered()
 * eigene Versanddaten ändern (Ownership-Check läuft im Service selbst).
 */
export async function updateShipmentAction(
  orderId: string,
  orderItemId: string,
  carrier: string,
  trackingNumber: string,
): Promise<ShipmentActionResult> {
  const userId = await requireUserId();

  if (!VALID_CARRIERS.includes(carrier as ShippingCarrier)) {
    return { success: false, error: "Bitte wähle einen gültigen Versanddienst." };
  }

  const trimmedTrackingNumber = trackingNumber.trim();
  if (trimmedTrackingNumber.length === 0) {
    return { success: false, error: "Bitte gib eine Trackingnummer an." };
  }
  if (trimmedTrackingNumber.length > 100) {
    return { success: false, error: "Die Trackingnummer darf maximal 100 Zeichen lang sein." };
  }

  const result = await updateShipment(userId, orderItemId, {
    carrier: carrier as ShippingCarrier,
    trackingNumber: trimmedTrackingNumber,
  });

  if (result.status === "not_found") {
    return { success: false, error: "Diese Bestellposition wurde nicht gefunden." };
  }

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/seller/orders");
  return { success: true };
}

export async function markDeliveredAction(
  orderId: string,
  orderItemId: string,
): Promise<ShipmentActionResult> {
  const userId = await requireUserId();
  const result = await markDelivered(userId, orderItemId);

  if (result.status === "not_found") {
    return { success: false, error: "Diese Bestellposition wurde nicht gefunden." };
  }
  if (result.status === "not_shipped") {
    return { success: false, error: "Diese Position muss zuerst als versendet markiert werden." };
  }

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/seller/orders");
  return { success: true };
}
