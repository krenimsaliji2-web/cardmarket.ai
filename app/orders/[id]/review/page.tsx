import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getOrder } from "@/services/orders/getOrder";
import { getReview } from "@/services/reviews/getReview";

import { ReviewForm } from "./review-form";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Bestellung bewerten – Project Atlas",
};

export default async function OrderReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const order = await getOrder(id, session.user.id);

  if (!order) {
    notFound();
  }

  // Eine Bestellung kann Positionen mehrerer Verkäufer enthalten (siehe
  // getSellerOrders.ts) – hier werden die eindeutigen Verkäufer ermittelt,
  // damit pro Verkäufer ein eigenes Bewertungsformular angezeigt wird.
  const sellers = Array.from(
    new Map(order.items.map((item) => [item.sellerId, item.sellerName])).entries(),
  ).map(([sellerId, sellerName]) => ({ sellerId, sellerName }));

  const existingReviews = await Promise.all(
    sellers.map((seller) => getReview(order.id, seller.sellerId, session.user.id)),
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Bestellung bewerten</h1>
        <p className="font-mono text-sm text-muted-foreground">Bestellung #{order.id}</p>
      </div>

      <div className="flex flex-col gap-6">
        {sellers.map((seller, index) => {
          const existing = existingReviews[index];
          return (
            <ReviewForm
              key={seller.sellerId}
              orderId={order.id}
              sellerId={seller.sellerId}
              sellerName={seller.sellerName}
              existingRating={existing?.rating ?? null}
              existingComment={existing?.comment ?? null}
            />
          );
        })}
      </div>
    </main>
  );
}
