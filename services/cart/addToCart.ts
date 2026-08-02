import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export type AddToCartErrorReason =
  | "listing_not_found"
  | "listing_inactive"
  | "own_listing"
  | "invalid_quantity";

export type AddToCartResult =
  | { status: "added"; quantity: number }
  | { status: "error"; reason: AddToCartErrorReason };

/**
 * Legt ein Listing im Warenkorb des Users ab (oder erhöht die Menge, falls
 * bereits vorhanden – pro Listing existiert höchstens eine CartItem-Zeile,
 * siehe @@unique([cartId, listingId]) in prisma/schema.prisma). Der Cart
 * wird beim ersten Hinzufügen automatisch angelegt (lazy, ein Cart pro User).
 */
export async function addToCart(
  userId: string,
  listingId: string,
  requestedQuantity: number,
): Promise<AddToCartResult> {
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return { status: "error", reason: "invalid_quantity" };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      isActive: true,
      quantity: true,
      seller: { select: { userId: true } },
    },
  });

  if (!listing) {
    return { status: "error", reason: "listing_not_found" };
  }
  if (!listing.isActive) {
    return { status: "error", reason: "listing_inactive" };
  }
  if (listing.seller.userId === userId) {
    return { status: "error", reason: "own_listing" };
  }

  // Race-Condition-sicher: bei zwei nahezu gleichzeitigen Aufrufen (z. B.
  // Doppelklick auf "In den Warenkorb" beim allerersten Artikel eines
  // Users) ist ein bloßes upsert() nicht atomar genug (siehe
  // services/collection/getCollection.ts) – P2002 abfangen und die
  // inzwischen angelegte Zeile erneut laden.
  let cart: { id: string };
  try {
    cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      cart = await prisma.cart.findUniqueOrThrow({ where: { userId }, select: { id: true } });
    } else {
      throw error;
    }
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_listingId: { cartId: cart.id, listingId } },
  });

  const desiredQuantity = Math.min(
    (existingItem?.quantity ?? 0) + requestedQuantity,
    listing.quantity,
  );

  if (existingItem) {
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: desiredQuantity },
    });
    return { status: "added", quantity: updated.quantity };
  }

  const created = await prisma.cartItem.create({
    data: { cartId: cart.id, listingId, quantity: desiredQuantity },
  });
  return { status: "added", quantity: created.quantity };
}
