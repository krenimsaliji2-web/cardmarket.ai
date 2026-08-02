import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { EditListingForm } from "./edit-listing-form";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Listing bearbeiten – Project Atlas",
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!sellerProfile) {
    redirect("/seller");
  }

  // Ownership-Check direkt in der Query: existiert kein Listing mit dieser
  // id UND dieser sellerId, ist es entweder fremd oder existiert nicht –
  // in beiden Fällen notFound(), ohne den Unterschied preiszugeben.
  const listing = await prisma.listing.findFirst({
    where: { id, sellerId: sellerProfile.id },
    select: {
      id: true,
      price: true,
      quantity: true,
      language: true,
      condition: true,
      isFoil: true,
      isSigned: true,
      description: true,
      edition: true,
      isFirstEdition: true,
      grading: true,
      card: {
        select: {
          name: true,
          image: true,
          set: { select: { name: true } },
          game: { select: { name: true } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, sortOrder: true, isPrimary: true },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Listing bearbeiten</CardTitle>
          <CardDescription>{listing.card.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <EditListingForm
            listing={{
              id: listing.id,
              price: listing.price.toString(),
              quantity: listing.quantity,
              language: listing.language,
              condition: listing.condition,
              isFoil: listing.isFoil,
              isSigned: listing.isSigned,
              description: listing.description,
              edition: listing.edition,
              isFirstEdition: listing.isFirstEdition,
              grading: listing.grading,
              card: listing.card,
              images: listing.images,
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
