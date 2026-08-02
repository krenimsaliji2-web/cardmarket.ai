import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/prisma/client";

export interface AdminListingListItem {
  id: string;
  cardName: string;
  cardImage: string | null;
  sellerName: string;
  sellerId: string;
  price: string;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
}

export interface GetListingsOptions {
  /** Teiltreffer auf Kartenname oder Verkäufername. */
  search?: string;
  /** Ohne Angabe werden aktive UND inaktive Listings angezeigt (Moderationsübersicht). */
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetListingsResult {
  items: AdminListingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt die Listing-Übersicht für /admin/listings. Gibt `null` zurück, wenn
 * der Aufrufer nicht existiert oder `role !== ADMIN` ist – identisches
 * Muster wie services/admin/getUsers.ts/getDashboard.ts.
 *
 * Anders als services/marketplace/searchMarketplace.ts (Käufer-Suche, nur
 * aktive Listings, Filter-Facetten) zeigt diese Übersicht bewusst AUCH
 * inaktive Listings standardmäßig (Moderation muss beides sehen) – keine
 * Duplikation der Marketplace-Suche, sondern ein eigener, admin-typischer
 * Anwendungsfall mit anderem Default. Echte DB-seitige Suche/Pagination.
 */
export async function getListings(
  callerId: string,
  options: GetListingsOptions = {},
): Promise<GetListingsResult | null> {
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true },
  });

  if (!caller || caller.role !== Role.ADMIN) {
    return null;
  }

  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const search = options.search?.trim();
  const where = {
    ...(options.activeOnly ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { card: { name: { contains: search, mode: "insensitive" as const } } },
            { seller: { displayName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [listingsRaw, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        price: true,
        quantity: true,
        isActive: true,
        createdAt: true,
        card: { select: { name: true, image: true } },
        seller: { select: { id: true, displayName: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items: listingsRaw.map((listing) => ({
      id: listing.id,
      cardName: listing.card.name,
      cardImage: listing.card.image,
      sellerName: listing.seller.displayName,
      sellerId: listing.seller.id,
      price: listing.price.toFixed(2),
      quantity: listing.quantity,
      isActive: listing.isActive,
      createdAt: listing.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}
