import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export interface CartItemResult {
  id: string;
  listingId: string;
  sellerId: string;
  quantity: number;
  price: string;
  subtotal: string;
  cardName: string;
  cardImage: string | null;
  sellerName: string;
  language: string;
  condition: string;
  /** Aktuell verfügbare Menge des Listings – zur Begrenzung der Mengenauswahl im UI. */
  availableQuantity: number;
  isActive: boolean;
}

export interface CartResult {
  items: CartItemResult[];
  totalPrice: string;
}

/**
 * Lädt den Warenkorb eines Users. Existiert (noch) kein Cart-Datensatz
 * (lazy angelegt, erst bei der ersten addToCart()-Aktion), wird ein leerer
 * Warenkorb zurückgegeben statt einer Fehlermeldung.
 */
export async function getCart(userId: string): Promise<CartResult> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          listing: {
            select: {
              id: true,
              sellerId: true,
              price: true,
              quantity: true,
              isActive: true,
              language: true,
              condition: true,
              card: { select: { name: true, image: true } },
              seller: { select: { displayName: true } },
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return { items: [], totalPrice: "0.00" };
  }

  // Decimal-Arithmetik statt number, um Floating-Point-Ungenauigkeit bei
  // Geldbeträgen zu vermeiden (gleiches Prinzip wie beim Preis-Parsing in
  // lib/validation/listing.ts).
  let total = new Prisma.Decimal(0);

  const items: CartItemResult[] = cart.items.map((item) => {
    const subtotal = item.listing.price.times(item.quantity);
    total = total.plus(subtotal);

    return {
      id: item.id,
      listingId: item.listing.id,
      sellerId: item.listing.sellerId,
      quantity: item.quantity,
      price: item.listing.price.toFixed(2),
      subtotal: subtotal.toFixed(2),
      cardName: item.listing.card.name,
      cardImage: item.listing.images[0]?.url ?? item.listing.card.image ?? null,
      sellerName: item.listing.seller.displayName,
      language: item.listing.language,
      condition: item.listing.condition,
      availableQuantity: item.listing.quantity,
      isActive: item.listing.isActive,
    };
  });

  return { items, totalPrice: total.toFixed(2) };
}
