"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { ImageOff, Search, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONDITIONS, LANGUAGES } from "@/lib/validation/listing";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validation/listingImages";
import type { CardSearchResult } from "@/services/listing/searchCards";
import { Badge } from "@/components/ui/badge";
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

import { createListingAction, searchCards, type ListingFormState } from "./actions";

const initialState: ListingFormState = { errors: {} };
const SEARCH_DEBOUNCE_MS = 250;
const ALLOWED_TYPES_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export function ListingForm() {
  // Kartensuche
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  // Formularfelder
  const [language, setLanguage] = useState("");
  const [condition, setCondition] = useState("");
  const [isFoil, setIsFoil] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isFirstEdition, setIsFirstEdition] = useState(false);

  // Bilder
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Absenden
  const [state, setState] = useState<ListingFormState>(initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selectedCard) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      startSearchTransition(async () => {
        const found = await searchCards(trimmed);
        setResults(found);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query, selectedCard]);

  const previewUrls = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images],
  );

  useEffect(() => {
    return () => {
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrls]);

  function addFiles(newFiles: File[]) {
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of newFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        rejected.push(`${file.name} (Format nicht unterstützt)`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        rejected.push(`${file.name} (größer als 10 MB)`);
        continue;
      }
      accepted.push(file);
    }

    setImages((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > MAX_IMAGES) {
        const overflow = combined.length - MAX_IMAGES;
        rejected.push(`${overflow} Bild(er) ignoriert (maximal ${MAX_IMAGES})`);
        return combined.slice(0, MAX_IMAGES);
      }
      return combined;
    });

    setImageError(rejected.length > 0 ? `Nicht übernommen: ${rejected.join(", ")}` : null);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(Array.from(event.target.files));
    }
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    for (const file of images) {
      formData.append("images", file);
    }

    startTransition(async () => {
      const result = await createListingAction(initialState, formData);
      setState(result);
    });
  }

  if (!selectedCard) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kartenname suchen…"
            className="pl-9"
            autoFocus
          />
        </div>

        {isSearching && (
          <p className="text-sm text-muted-foreground">Suche…</p>
        )}

        {!isSearching && query.trim().length > 0 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">Keine Karten gefunden.</p>
        )}

        {results.length > 0 && (
          <ul className="divide-y rounded-md border">
            {results.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCard(card);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted"
                >
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                    <img
                      src={card.image}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-muted">
                      <ImageOff className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{card.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {card.game.name} · {card.set.name} · #{card.cardNumber}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="cardId" value={selectedCard.id} />
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="condition" value={condition} />
      <input type="hidden" name="isFoil" value={isFoil ? "true" : "false"} />
      <input type="hidden" name="isSigned" value={isSigned ? "true" : "false"} />
      <input type="hidden" name="isFirstEdition" value={isFirstEdition ? "true" : "false"} />

      <div className="flex items-start gap-4 rounded-md border p-4">
        {selectedCard.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
          <img
            src={selectedCard.image}
            alt={selectedCard.name}
            className="h-28 w-20 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded bg-muted">
            <ImageOff className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{selectedCard.name}</p>
          <p className="text-sm text-muted-foreground">{selectedCard.set.name}</p>
          <p className="text-sm text-muted-foreground">{selectedCard.game.name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setSelectedCard(null)}
        >
          Andere Karte wählen
        </Button>
      </div>
      {state.errors.cardId && (
        <p className="text-sm text-destructive">{state.errors.cardId}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Preis</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="19.99"
            required
            disabled={isPending}
            aria-invalid={!!state.errors.price}
          />
          {state.errors.price && (
            <p className="text-sm text-destructive">{state.errors.price}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Anzahl</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            required
            disabled={isPending}
            aria-invalid={!!state.errors.quantity}
          />
          {state.errors.quantity && (
            <p className="text-sm text-destructive">{state.errors.quantity}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="language-trigger">Sprache</Label>
          <Select value={language} onValueChange={setLanguage} disabled={isPending}>
            <SelectTrigger
              id="language-trigger"
              className="w-full"
              aria-invalid={!!state.errors.language}
            >
              <SelectValue placeholder="Sprache wählen" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.language && (
            <p className="text-sm text-destructive">{state.errors.language}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition-trigger">Zustand</Label>
          <Select value={condition} onValueChange={setCondition} disabled={isPending}>
            <SelectTrigger
              id="condition-trigger"
              className="w-full"
              aria-invalid={!!state.errors.condition}
            >
              <SelectValue placeholder="Zustand wählen" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.condition && (
            <p className="text-sm text-destructive">{state.errors.condition}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isFoilCheckbox"
            checked={isFoil}
            onCheckedChange={(checked) => setIsFoil(checked === true)}
            disabled={isPending}
          />
          <Label htmlFor="isFoilCheckbox" className="font-normal">
            Foil
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isSignedCheckbox"
            checked={isSigned}
            onCheckedChange={(checked) => setIsSigned(checked === true)}
            disabled={isPending}
          />
          <Label htmlFor="isSignedCheckbox" className="font-normal">
            Signiert
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isFirstEditionCheckbox"
            checked={isFirstEdition}
            onCheckedChange={(checked) => setIsFirstEdition(checked === true)}
            disabled={isPending}
          />
          <Label htmlFor="isFirstEditionCheckbox" className="font-normal">
            Erstauflage (First Edition)
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edition">Edition (optional)</Label>
          <Input
            id="edition"
            name="edition"
            placeholder="z. B. Unlimited, Shadowless"
            disabled={isPending}
            aria-invalid={!!state.errors.edition}
          />
          {state.errors.edition && (
            <p className="text-sm text-destructive">{state.errors.edition}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="grading">Grading (optional)</Label>
          <Input
            id="grading"
            name="grading"
            placeholder="z. B. PSA 10"
            disabled={isPending}
            aria-invalid={!!state.errors.grading}
          />
          {state.errors.grading && (
            <p className="text-sm text-destructive">{state.errors.grading}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Bilder (max. {MAX_IMAGES}, JPG/PNG/WEBP, je max. 10 MB)</Label>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors",
            isDraggingOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Bilder hierher ziehen oder{" "}
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              auswählen
            </button>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES_ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {imageError && <p className="text-sm text-destructive">{imageError}</p>}
        {state.errors.images && (
          <p className="text-sm text-destructive">{state.errors.images}</p>
        )}

        {images.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((file, index) => (
              <li key={`${file.name}-${index}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale Objekt-URL für die Vorschau. */}
                <img
                  src={previewUrls[index]}
                  alt=""
                  className="aspect-square w-full rounded-md border object-cover"
                />
                {index === 0 && (
                  <Badge className="absolute top-1 left-1">Hauptbild</Badge>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => removeImage(index)}
                  aria-label={`${file.name} entfernen`}
                  className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          disabled={isPending}
          aria-invalid={!!state.errors.description}
        />
        {state.errors.description && (
          <p className="text-sm text-destructive">{state.errors.description}</p>
        )}
      </div>

      {state.errors.form && (
        <p className="text-sm text-destructive">{state.errors.form}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Wird erstellt…" : "Listing erstellen"}
      </Button>
    </form>
  );
}
