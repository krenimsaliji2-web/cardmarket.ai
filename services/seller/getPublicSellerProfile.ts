import { prisma } from "@/lib/prisma";
import { getFollowerCount } from "@/services/follow/getFollowerCount";

export interface PublicSellerProfileStats {
  listingCount: number;
  salesCount: number;
  followerCount: number;
}

export interface PublicSellerProfileResult {
  id: string;
  /** Nur für den serverseitigen Ownership-Vergleich (Bearbeiten-Button) – wird nirgends direkt angezeigt. */
  userId: string;
  displayName: string;
  verified: boolean;
  avatar: string | null;
  bannerImage: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  companyName: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  discordUrl: string | null;
  location: string | null;
  country: string;
  /** "Mitglied seit" – nutzt das bereits bestehende Feld, kein neues Feld nötig. */
  createdAt: Date;
  shippingCountries: string[];
  shippingTime: string | null;
  responseTime: string | null;
  shopRules: string | null;
  returnPolicy: string | null;
  stats: PublicSellerProfileStats;
}

/**
 * Lädt das vollständige, öffentlich sichtbare Verkäuferprofil (inkl. der
 * in Feature 50 neuen Felder + Statistiken) für /seller/[id]. Kein
 * Ownership-Check – diese Daten sind für jeden Besucher öffentlich; die
 * `userId` wird nur zurückgegeben, damit die Route ohne weitere Query
 * feststellen kann, ob der eingeloggte Besucher der Profil-Inhaber ist
 * (Bearbeiten-Button). Gibt `null` zurück, falls kein SellerProfile mit
 * dieser ID existiert.
 *
 * Bewertungen/Bewertungsdurchschnitt werden bewusst NICHT hier berechnet
 * (Reviews ist laut Ticket "NICHT ÄNDERN") – die Route ruft dafür weiterhin
 * die unveränderten services/reviews/{getSellerRating,getSellerReviews}.ts
 * auf, parallel zu diesem Service.
 *
 * Performance: eine Query für das Profil (inkl. Listing-Anzahl über
 * `_count`, keine zusätzliche Relation-Query) + eine unabhängige
 * `orderItem.count()` für die Verkäufe + getFollowerCount() (Feature 53,
 * services/follow/), alle drei parallel über Promise.all – keine N+1,
 * keine überflüssigen Relations.
 */
export async function getPublicSellerProfile(
  sellerId: string,
): Promise<PublicSellerProfileResult | null> {
  const [seller, salesCount, followerCount] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        userId: true,
        displayName: true,
        verified: true,
        avatar: true,
        bannerImage: true,
        shortDescription: true,
        longDescription: true,
        companyName: true,
        website: true,
        instagramUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        discordUrl: true,
        location: true,
        country: true,
        createdAt: true,
        shippingCountries: true,
        shippingTime: true,
        responseTime: true,
        shopRules: true,
        returnPolicy: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.orderItem.count({ where: { sellerId } }),
    getFollowerCount(sellerId),
  ]);

  if (!seller) {
    return null;
  }

  return {
    id: seller.id,
    userId: seller.userId,
    displayName: seller.displayName,
    verified: seller.verified,
    avatar: seller.avatar,
    bannerImage: seller.bannerImage,
    shortDescription: seller.shortDescription,
    longDescription: seller.longDescription,
    companyName: seller.companyName,
    website: seller.website,
    instagramUrl: seller.instagramUrl,
    facebookUrl: seller.facebookUrl,
    youtubeUrl: seller.youtubeUrl,
    discordUrl: seller.discordUrl,
    location: seller.location,
    country: seller.country,
    createdAt: seller.createdAt,
    shippingCountries: seller.shippingCountries,
    shippingTime: seller.shippingTime,
    responseTime: seller.responseTime,
    shopRules: seller.shopRules,
    returnPolicy: seller.returnPolicy,
    stats: {
      listingCount: seller._count.listings,
      salesCount,
      followerCount,
    },
  };
}
