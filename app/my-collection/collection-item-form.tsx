"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { CONDITIONS, LANGUAGES } from "@/lib/validation/listing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { removeFromCollectionAction, updateCollectionItemAction } from "./actions";
import type { UpdateCollectionItemFormState } from "./actions";

const initialState: UpdateCollectionItemFormState = { errors: {} };

interface CollectionItemFormProps {
  itemId: string;
  quantity: number;
  language: string;
  condition: string;
  foil: boolean;
  purchasePrice: string | null;
  notes: string | null;
}

export function CollectionItemForm({
  itemId,
  quantity,
  language,
  condition,
  foil,
  purchasePrice,
  notes,
}: CollectionItemFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateCollectionItemAction, initialState);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedCondition, setSelectedCondition] = useState(condition);
  const [isFoil, setIsFoil] = useState(foil);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    removeFromCollectionAction(itemId)
      .then((result) => {
        if (!result.success) {
          setDeleteError(result.error ?? "Fehler beim Löschen.");
          setIsDeleting(false);
          return;
        }
        router.refresh();
      })
      .catch(() => {
        setDeleteError("Fehler beim Löschen.");
        setIsDeleting(false);
      });
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="language" value={selectedLanguage} />
      <input type="hidden" name="condition" value={selectedCondition} />
      <input type="hidden" name="foil" value={isFoil ? "on" : "off"} />

      <div className="space-y-1">
        <Label htmlFor={`quantity-${itemId}`} className="text-xs">Menge</Label>
        <Input
          id={`quantity-${itemId}`}
          name="quantity"
          type="number"
          min={1}
          defaultValue={quantity}
          disabled={isPending || isDeleting}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`language-trigger-${itemId}`} className="text-xs">Sprache</Label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isPending || isDeleting}>
          <SelectTrigger id={`language-trigger-${itemId}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`condition-trigger-${itemId}`} className="text-xs">Zustand</Label>
        <Select value={selectedCondition} onValueChange={setSelectedCondition} disabled={isPending || isDeleting}>
          <SelectTrigger id={`condition-trigger-${itemId}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`purchasePrice-${itemId}`} className="text-xs">Kaufpreis</Label>
        <Input
          id={`purchasePrice-${itemId}`}
          name="purchasePrice"
          type="text"
          inputMode="decimal"
          defaultValue={purchasePrice ?? ""}
          placeholder="z. B. 12.50"
          disabled={isPending || isDeleting}
        />
      </div>

      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <Checkbox
          id={`foil-${itemId}`}
          checked={isFoil}
          onCheckedChange={(checked) => setIsFoil(checked === true)}
          disabled={isPending || isDeleting}
        />
        <Label htmlFor={`foil-${itemId}`} className="font-normal">Foil</Label>
      </div>

      <div className="col-span-2 space-y-1 sm:col-span-3">
        <Label htmlFor={`notes-${itemId}`} className="text-xs">Notizen</Label>
        <Textarea
          id={`notes-${itemId}`}
          name="notes"
          rows={2}
          maxLength={1000}
          defaultValue={notes ?? ""}
          disabled={isPending || isDeleting}
        />
      </div>

      <div className="col-span-2 flex items-end justify-between gap-2 sm:col-span-4">
        <div className="space-y-1">
          {state.errors.general && <p className="text-xs text-destructive">{state.errors.general}</p>}
          {state.errors.quantity && <p className="text-xs text-destructive">{state.errors.quantity}</p>}
          {state.errors.purchasePrice && <p className="text-xs text-destructive">{state.errors.purchasePrice}</p>}
          {state.errors.notes && <p className="text-xs text-destructive">{state.errors.notes}</p>}
          {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
          {state.success && <p className="text-xs text-muted-foreground">Gespeichert.</p>}
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending || isDeleting}>
            {isPending ? "Speichert…" : "Speichern"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isPending || isDeleting}
            onClick={handleDelete}
            aria-label="Aus der Sammlung entfernen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
