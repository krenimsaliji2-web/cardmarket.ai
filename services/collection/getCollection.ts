import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export interface CollectionItemResult {
  id: string;
  cardId: string;
  cardName: string;
  cardImage: string;
  setName: string;
  quantity: number;
  language: string;
  condition: string;
  foil: boolean;
  purchasePrice: string | null;
  estimatedValue: string | null;
  notes: string | null;
}

export interface CollectionResult {
  id: string;
  items: CollectionItemResult[];
}

/**
 * Jeder User besitzt genau eine Collection – existiert noch keine, wird sie
 * hier lazy angelegt. Wiederverwendet von addToCollection()/
 * updateCollectionItem()/removeFromCollection()/calculateCollectionValue(),
 * damit die "genau eine Collection pro User"-Regel an genau einer Stelle
 * lebt – u. a. `app/my-collection/page.tsx` ruft getCollection() und
 * calculateCollectionValue() über Promise.all() parallel auf, beide landen
 * hier. `upsert()` allein ist bei zwei echt gleichzeitigen Aufrufen für
 * denselben (noch nicht existierenden) User NICHT race-safe – Prisma prüft
 * intern erst per SELECT, bevor es INSERT/UPDATE wählt, klassisches TOCTOU.
 * Bei einem Konflikt (P2002) wird die inzwischen vom parallelen Aufruf
 * angelegte Zeile stattdessen erneut geladen, gleiches Muster wie
 * services/messages/createConversation.ts.
 */
export async function getOrCreateCollection(userId: string): Promise<{ id: string }> {
  try {
    return await prisma.collection.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.collection.findUniqueOrThrow({
        where: { userId },
        select: { id: true },
      });
    }
    throw error;
  }
}

/** Lädt die Collection eines Users inkl. aller Items, neueste zuerst. */
export async function getCollection(userId: string): Promise<CollectionResult> {
  const collection = await getOrCreateCollection(userId);

  const items = await prisma.collectionItem.findMany({
    where: { collectionId: collection.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cardId: true,
      quantity: true,
      language: true,
      condition: true,
      foil: true,
      purchasePrice: true,
      estimatedValue: true,
      notes: true,
      card: {
        select: { name: true, image: true, set: { select: { name: true } } },
      },
    },
  });

  return {
    id: collection.id,
    items: items.map((item) => ({
      id: item.id,
      cardId: item.cardId,
      cardName: item.card.name,
      cardImage: item.card.image,
      setName: item.card.set.name,
      quantity: item.quantity,
      language: item.language,
      condition: item.condition,
      foil: item.foil,
      purchasePrice: item.purchasePrice?.toFixed(2) ?? null,
      estimatedValue: item.estimatedValue?.toFixed(2) ?? null,
      notes: item.notes,
    })),
  };
}
