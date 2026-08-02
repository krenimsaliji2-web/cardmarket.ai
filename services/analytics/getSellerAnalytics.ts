import { prisma } from "@/lib/prisma";

import { calculateSellerAnalytics, type SellerAnalyticsResult } from "./calculateSellerAnalytics";

/**
 * Löst das SellerProfile eines Users auf und liefert die vollständigen
 * Analytics (siehe calculateSellerAnalytics.ts). Gibt `null` zurück, wenn
 * der User (noch) kein SellerProfile besitzt – die Route leitet in diesem
 * Fall weiter, statt selbst Prisma abzufragen (gleiches Muster wie
 * getSellerDashboard.ts aus Feature 34).
 */
export async function getSellerAnalytics(userId: string): Promise<SellerAnalyticsResult | null> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!sellerProfile) {
    return null;
  }

  return calculateSellerAnalytics(sellerProfile.id);
}
