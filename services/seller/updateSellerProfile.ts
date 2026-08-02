import { prisma } from "@/lib/prisma";
import type { StorageProvider } from "@/services/storage/StorageProvider";

export interface UpdateSellerProfileInput {
  /** Neue Datei zum Ersetzen des Bannerbilds; unverändert, wenn nicht angegeben. */
  bannerImageFile?: File;
  /** Neue Datei zum Ersetzen des Profilbilds; unverändert, wenn nicht angegeben. */
  avatarFile?: File;
  shortDescription?: string;
  longDescription?: string;
  companyName?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  location?: string;
  shippingCountries: string[];
  shippingTime?: string;
  responseTime?: string;
  shopRules?: string;
  returnPolicy?: string;
}

export type UpdateSellerProfileResult = { status: "updated" } | { status: "not_found" };

/**
 * Aktualisiert das SellerProfile des aufrufenden Users. Der Ownership-Check
 * ist hier strukturell eingebaut, nicht nachträglich geprüft: das Profil
 * wird ausschließlich über die `userId` der Server-Session gesucht (nie
 * über eine vom Client übergebene SellerProfile-ID) – ein User kann
 * dadurch gar nicht erst versuchen, ein fremdes Profil zu adressieren.
 *
 * Reihenfolge bei Bilder-Ersetzung (analog zu services/listing/updateListing.ts):
 * 1. Neue Datei(en) über den injizierten StorageProvider speichern.
 * 2. SellerProfile-Update (inkl. neuer URLs) in der Datenbank.
 * 3. Erst nach erfolgreichem Update die alte(n) Datei(en) löschen – schlägt
 *    das fehl, bleibt höchstens eine verwaiste Datei übrig, nie eine
 *    kaputte Datenbankreferenz.
 */
export async function updateSellerProfile(
  userId: string,
  input: UpdateSellerProfileInput,
  storageProvider: StorageProvider,
): Promise<UpdateSellerProfileResult> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true, bannerImage: true, avatar: true },
  });

  if (!seller) {
    return { status: "not_found" };
  }

  let bannerImage = seller.bannerImage;
  if (input.bannerImageFile) {
    const buffer = Buffer.from(await input.bannerImageFile.arrayBuffer());
    const stored = await storageProvider.save({
      filename: input.bannerImageFile.name,
      contentType: input.bannerImageFile.type,
      buffer,
    });
    bannerImage = stored.url;
  }

  let avatar = seller.avatar;
  if (input.avatarFile) {
    const buffer = Buffer.from(await input.avatarFile.arrayBuffer());
    const stored = await storageProvider.save({
      filename: input.avatarFile.name,
      contentType: input.avatarFile.type,
      buffer,
    });
    avatar = stored.url;
  }

  await prisma.sellerProfile.update({
    where: { id: seller.id },
    data: {
      bannerImage,
      avatar,
      shortDescription: input.shortDescription ?? null,
      longDescription: input.longDescription ?? null,
      companyName: input.companyName ?? null,
      website: input.website ?? null,
      instagramUrl: input.instagramUrl ?? null,
      facebookUrl: input.facebookUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      discordUrl: input.discordUrl ?? null,
      location: input.location ?? null,
      shippingCountries: input.shippingCountries,
      shippingTime: input.shippingTime ?? null,
      responseTime: input.responseTime ?? null,
      shopRules: input.shopRules ?? null,
      returnPolicy: input.returnPolicy ?? null,
    },
  });

  if (input.bannerImageFile && seller.bannerImage) {
    await storageProvider.delete(seller.bannerImage);
  }
  if (input.avatarFile && seller.avatar) {
    await storageProvider.delete(seller.avatar);
  }

  return { status: "updated" };
}
