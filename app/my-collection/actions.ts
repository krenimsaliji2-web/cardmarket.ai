"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { updateCollectionItemSchema } from "@/lib/validation/collectionItem";
import { removeFromCollection } from "@/services/collection/removeFromCollection";
import { updateCollectionItem } from "@/services/collection/updateCollectionItem";

export interface UpdateCollectionItemFormState {
  errors: {
    quantity?: string;
    language?: string;
    condition?: string;
    purchasePrice?: string;
    notes?: string;
    general?: string;
  };
  success?: boolean;
}

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

export async function updateCollectionItemAction(
  _prevState: UpdateCollectionItemFormState,
  formData: FormData,
): Promise<UpdateCollectionItemFormState> {
  const userId = await requireUserId();

  const itemId = String(formData.get("itemId") ?? "");
  const rawPurchasePrice = formData.get("purchasePrice");
  const rawNotes = formData.get("notes");

  const result = updateCollectionItemSchema.safeParse({
    quantity: String(formData.get("quantity") ?? ""),
    language: String(formData.get("language") ?? ""),
    condition: String(formData.get("condition") ?? ""),
    foil: formData.get("foil") === "on",
    purchasePrice:
      typeof rawPurchasePrice === "string" && rawPurchasePrice.trim() !== ""
        ? rawPurchasePrice
        : undefined,
    notes: typeof rawNotes === "string" && rawNotes.trim() !== "" ? rawNotes : undefined,
  });

  if (!result.success) {
    const errors: UpdateCollectionItemFormState["errors"] = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof UpdateCollectionItemFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { errors };
  }

  const updateResult = await updateCollectionItem(itemId, userId, {
    quantity: result.data.quantity,
    language: result.data.language,
    condition: result.data.condition,
    foil: result.data.foil,
    purchasePrice: result.data.purchasePrice ?? null,
    notes: result.data.notes ?? null,
  });

  if (updateResult.status === "not_found") {
    return { errors: { general: "Dieser Sammlungseintrag wurde nicht gefunden." } };
  }

  revalidatePath("/my-collection");
  return { errors: {}, success: true };
}

export interface RemoveCollectionItemResult {
  success: boolean;
  error?: string;
}

export async function removeFromCollectionAction(
  itemId: string,
): Promise<RemoveCollectionItemResult> {
  const userId = await requireUserId();
  const result = await removeFromCollection(itemId, userId);

  if (result.status === "not_found") {
    return { success: false, error: "Dieser Sammlungseintrag wurde nicht gefunden." };
  }

  revalidatePath("/my-collection");
  return { success: true };
}
