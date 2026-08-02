import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getListings } from "@/services/admin/getListings";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AdminNav } from "../admin-nav";
import { ListingRowActions } from "./listing-row-actions";
import { ListingSearch } from "./listing-search";

export const metadata: Metadata = {
  title: "Listings – Project Atlas",
};

interface AdminListingsPageProps {
  searchParams: Promise<{ search?: string; activeOnly?: string; page?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const { search: searchParam, activeOnly: activeOnlyParam, page: pageParam } = await searchParams;
  const search = searchParam ?? "";
  const activeOnly = activeOnlyParam === "true";
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Die Route ruft ausschließlich getListings() auf – keine eigenen
  // Prisma-Abfragen hier.
  const result = await getListings(session.user.id, {
    search: search || undefined,
    activeOnly: activeOnly || undefined,
    page,
  });

  if (!result) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const currentPage = Math.min(Math.max(result.page, 1), totalPages);

  function buildPageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeOnly) params.set("activeOnly", "true");
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/admin/listings${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Listings</h1>

      <AdminNav active="listings" />

      <ListingSearch initialSearch={search} initialActiveOnly={activeOnly} />

      <p className="text-sm text-muted-foreground">
        {result.total} {result.total === 1 ? "Listing" : "Listings"} gefunden
      </p>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Listings gefunden.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                  {listing.cardImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                    <img src={listing.cardImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{listing.cardName}</p>
                    <Badge variant={listing.isActive ? "default" : "outline"}>
                      {listing.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verkäufer:{" "}
                    <Link href={`/seller/${listing.sellerId}`} className="hover:underline">
                      {listing.sellerName}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(listing.price)} · Menge: {listing.quantity} ·{" "}
                    {formatDate(listing.createdAt)}
                  </p>
                </div>

                <ListingRowActions listingId={listing.id} isActive={listing.isActive} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(currentPage - 1)}>Zurück</Link>
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
              <Link href={buildPageHref(currentPage + 1)}>Weiter</Link>
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
