import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export interface PriceExpectation {
  cartItemId: string;
  expectedPrice: string;
}

export interface ValidatedCartItem {
  cartItemId: string;
  listingId: string;
  quantity: number;
  price: Prisma.Decimal;
  cardName: string;
  cardImage: string | null;
  sellerName: string;
}

export type ValidateCartResult =
  | { status: "ok"; items: ValidatedCartItem[] }
  | { status: "error"; reason: "empty_cart" | "listing_changed" | "own_listing" };

/**
 * Prüft jede Warenkorb-Position unmittelbar vor dem Checkout erneut gegen
 * die aktuelle DB (Listing existiert/aktiv/Menge verfügbar/Verkäufer
 * existiert, Preis unverändert). `priceExpectations` sind die Preise, die
 * dem User zuletzt angezeigt wurden (aus getCart() beim Laden von
 * /checkout) – weichen sie vom aktuellen Listing-Preis ab, gilt das als
 * Änderung, auch wenn sich sonst nichts geändert hat.
 */
export async function validateCart(
  userId: string,
  priceExpectations: PriceExpectation[],
): Promise<ValidateCartResult> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: {
        select: {
          id: true,
          quantity: true,
          listing: {
            select: {
              id: true,
              price: true,
              quantity: true,
              isActive: true,
              card: { select: { name: true, image: true } },
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
              seller: { select: { userId: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { status: "error", reason: "empty_cart" };
  }

  const expectedByItemId = new Map(
    priceExpectations.map((expectation) => [expectation.cartItemId, expectation.expectedPrice]),
  );

  const items: ValidatedCartItem[] = [];

  for (const item of cart.items) {
    const { listing } = item;

    // listing/seller sind laut Schema Pflichtrelationen (Restrict), die
    // Prüfung bleibt trotzdem explizit stehen, da sie in den Anforderungen
    // ausdrücklich gefordert ist und die Kette robust gegen künftige
    // Schemaänderungen hält.
    if (!listing || !listing.isActive || !listing.seller) {
      return { status: "error", reason: "listing_changed" };
    }

    // Defense in Depth: addToCart() (services/cart/addToCart.ts) blockt den
    // Kauf eigener Listings bereits beim Hinzufügen zum Warenkorb – diese
    // Prüfung wiederholt dieselbe Regel unmittelbar vor der Zahlung, dem
    // letzten Gate vor dem Geldfluss (Ticket: "Käufer ≠ Verkäufer").
    if (listing.seller.userId === userId) {
      return { status: "error", reason: "own_listing" };
    }

    if (listing.quantity < item.quantity) {
      return { status: "error", reason: "listing_changed" };
    }

    const expectedPrice = expectedByItemId.get(item.id);
    if (expectedPrice === undefined || !listing.price.equals(new Prisma.Decimal(expectedPrice))) {
      return { status: "error", reason: "listing_changed" };
    }

    items.push({
      cartItemId: item.id,
      listingId: listing.id,
      quantity: item.quantity,
      price: listing.price,
      cardName: listing.card.name,
      cardImage: listing.images[0]?.url ?? listing.card.image ?? null,
      sellerName: listing.seller.displayName,
    });
  }

  return { status: "ok", items };
}
