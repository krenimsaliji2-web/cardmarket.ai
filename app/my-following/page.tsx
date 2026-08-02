import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth } from "@/lib/auth";
import { getFollowingSellers } from "@/services/follow/getFollowingSellers";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Gefolgte Verkäufer – Project Atlas",
};

interface MyFollowingPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyFollowingPage({ searchParams }: MyFollowingPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { page: pageParam } = await searchParams;
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const following = await getFollowingSellers(session.user.id, { page });

  const totalPages = Math.max(1, Math.ceil(following.total / following.pageSize));
  const currentPage = Math.min(Math.max(following.page, 1), totalPages);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Gefolgte Verkäufer</h1>

      {following.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Du folgst noch keinen Verkäufern.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {following.items.map((seller) => (
            <Card key={seller.sellerProfileId} className="overflow-hidden py-0">
              <div className="aspect-[5/1] w-full bg-gradient-to-r from-muted to-muted-foreground/10">
                {seller.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                  <img src={seller.bannerImage} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="-mt-8 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted">
                  {seller.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                    <img src={seller.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {seller.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{seller.displayName}</p>
                    <Badge variant={seller.verified ? "default" : "outline"}>
                      {seller.verified ? "Verifiziert" : "Nicht verifiziert"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                      {seller.averageRating !== null ? seller.averageRating.toFixed(1) : "–"}
                    </span>
                    <span>{seller.salesCount} Verkäufe</span>
                    <span>{seller.listingCount} Listings</span>
                    <span>Folgst du seit {formatDate(seller.followingSince)}</span>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/seller/${seller.sellerProfileId}`}>Profil öffnen</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/my-following?page=${currentPage - 1}`}>Zurück</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Zurück
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages}
          </p>

          {currentPage < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/my-following?page=${currentPage + 1}`}>Weiter</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Weiter
            </Button>
          )}
        </nav>
      )}
    </main>
  );
}
