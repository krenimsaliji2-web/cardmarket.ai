import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ExternalLink, Globe, Star } from "lucide-react";

import { auth } from "@/lib/auth";
import { isFollowingSeller } from "@/services/follow/isFollowingSeller";
import { getSellerRating } from "@/services/reviews/getSellerRating";
import { getSellerReviews } from "@/services/reviews/getSellerReviews";
import { getPublicSellerProfile } from "@/services/seller/getPublicSellerProfile";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FollowSellerButton } from "./follow-seller-button";
import { MessageSellerButton } from "./message-seller-button";
import { SellerProfileEditForm } from "./seller-profile-edit-form";

interface SellerProfilePageProps {
  params: Promise<{ id: string }>;
}

const RECENT_REVIEWS_LIMIT = 20;

export async function generateMetadata({ params }: SellerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await getPublicSellerProfile(id);

  if (!seller) {
    return { title: "Verkäufer nicht gefunden – Project Atlas" };
  }

  return { title: `${seller.displayName} – Project Atlas` };
}

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const { id } = await params;

  const seller = await getPublicSellerProfile(id);

  if (!seller) {
    notFound();
  }

  const [session, rating, reviews] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getSellerRating(seller.id),
    getSellerReviews(seller.id, RECENT_REVIEWS_LIMIT),
  ]);

  const isOwner = session?.user.id === seller.userId;
  const isFollowing =
    session && !isOwner ? await isFollowingSeller(session.user.id, seller.id) : false;

  const socialLinks = [
    seller.website && { href: seller.website, label: "Website", icon: Globe },
    seller.instagramUrl && { href: seller.instagramUrl, label: "Instagram", icon: ExternalLink },
    seller.facebookUrl && { href: seller.facebookUrl, label: "Facebook", icon: ExternalLink },
    seller.youtubeUrl && { href: seller.youtubeUrl, label: "YouTube", icon: ExternalLink },
    seller.discordUrl && { href: seller.discordUrl, label: "Discord", icon: ExternalLink },
  ].filter((entry): entry is { href: string; label: string; icon: typeof Globe } => !!entry);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          <div className="aspect-4/1 w-full bg-gradient-to-r from-muted to-muted-foreground/10">
            {seller.bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
              <img src={seller.bannerImage} alt="" className="h-full w-full object-cover" />
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4 p-4 pt-0">
            <div className="-mt-10 size-20 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted">
              {seller.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                <img src={seller.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                  {seller.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{seller.displayName}</h1>
                <Badge variant={seller.verified ? "default" : "outline"}>
                  {seller.verified ? "Verifiziert" : "Nicht verifiziert"}
                </Badge>
              </div>
              {seller.companyName && (
                <p className="text-sm text-muted-foreground">{seller.companyName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {seller.location ?? seller.country} · Mitglied seit {formatDate(seller.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {seller.shortDescription && (
          <p className="text-sm text-foreground/90">{seller.shortDescription}</p>
        )}

        {isOwner && (
          <SellerProfileEditForm
            initial={{
              sellerId: seller.id,
              shortDescription: seller.shortDescription ?? "",
              longDescription: seller.longDescription ?? "",
              companyName: seller.companyName ?? "",
              website: seller.website ?? "",
              instagramUrl: seller.instagramUrl ?? "",
              facebookUrl: seller.facebookUrl ?? "",
              youtubeUrl: seller.youtubeUrl ?? "",
              discordUrl: seller.discordUrl ?? "",
              location: seller.location ?? "",
              shippingCountries: seller.shippingCountries,
              shippingTime: seller.shippingTime ?? "",
              responseTime: seller.responseTime ?? "",
              shopRules: seller.shopRules ?? "",
              returnPolicy: seller.returnPolicy ?? "",
            }}
          />
        )}

        {!isOwner && (
          <div className="flex flex-wrap gap-2">
            <FollowSellerButton sellerId={seller.id} initialIsFollowing={isFollowing} />
            <MessageSellerButton sellerId={seller.id} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Listings" value={String(seller.stats.listingCount)} />
        <StatCard label="Verkäufe" value={String(seller.stats.salesCount)} />
        <StatCard label="Bewertungen" value={String(rating.totalReviews)} />
        <StatCard
          label="Ø Bewertung"
          value={rating.averageRating !== null ? rating.averageRating.toFixed(1) : "–"}
        />
        <StatCard label="Follower" value={String(seller.stats.followerCount)} />
      </section>

      {socialLinks.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {socialLinks.map((link) => (
            <Badge key={link.label} variant="secondary" asChild>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                <link.icon className="size-3.5" />
                {link.label}
              </a>
            </Badge>
          ))}
        </section>
      )}

      {seller.longDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Über diesen Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground/90">{seller.longDescription}</p>
          </CardContent>
        </Card>
      )}

      {(seller.shippingCountries.length > 0 || seller.shippingTime || seller.responseTime) && (
        <Card>
          <CardHeader>
            <CardTitle>Versandinformationen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {seller.shippingCountries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Versandländer:</span>
                {seller.shippingCountries.map((country) => (
                  <Badge key={country} variant="secondary">
                    {country}
                  </Badge>
                ))}
              </div>
            )}
            {seller.shippingTime && (
              <p>
                <span className="text-muted-foreground">Versandzeit:</span> {seller.shippingTime}
              </p>
            )}
            {seller.responseTime && (
              <p>
                <span className="text-muted-foreground">Antwortzeit:</span> {seller.responseTime}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {seller.shopRules && (
        <Card>
          <CardHeader>
            <CardTitle>Shop-Regeln</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground/90">{seller.shopRules}</p>
          </CardContent>
        </Card>
      )}

      {seller.returnPolicy && (
        <Card>
          <CardHeader>
            <CardTitle>Rückgabebedingungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground/90">{seller.returnPolicy}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bewertungen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-4xl font-bold tracking-tight">
              {rating.averageRating !== null ? rating.averageRating.toFixed(1) : "–"}
            </p>
            <div className="space-y-1">
              <StarDisplay value={rating.averageRating ?? 0} />
              <p className="text-sm text-muted-foreground">
                {rating.totalReviews} {rating.totalReviews === 1 ? "Bewertung" : "Bewertungen"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = rating.distribution[stars];
              const percentage =
                rating.totalReviews === 0 ? 0 : Math.round((count / rating.totalReviews) * 100);
              return (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 text-muted-foreground">{stars} Sterne</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Bewertungen</h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Dieser Verkäufer hat noch keine Bewertungen.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarDisplay value={review.rating} />
                      <span className="text-sm font-medium">{review.buyerName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/90">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value.toFixed(1)} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= Math.round(value)
              ? "size-4 fill-yellow-400 text-yellow-400"
              : "size-4 text-muted-foreground"
          }
        />
      ))}
    </div>
  );
}
