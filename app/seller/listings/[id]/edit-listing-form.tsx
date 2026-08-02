"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { ChevronLeft, ChevronRight, ImageOff, Loader2, Star, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONDITIONS, LANGUAGES } from "@/lib/validation/listing";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validation/listingImages";
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

import { updateListingAction, type UpdateListingFormState } from "./actions";
import {
  deleteListingImageAction,
  reorderListingImagesAction,
  setPrimaryListingImageAction,
  uploadListingImagesAction,
} from "./image-actions";

const initialState: UpdateListingFormState = { errors: {} };
const ALLOWED_TYPES_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

type PersistedImage = { kind: "persisted"; id: string; url: string; isPrimary: boolean };
type UploadingImage = { kind: "uploading"; key: string; previewUrl: string };
type ImageItem = PersistedImage | UploadingImage;

interface EditListingFormProps {
  listing: {
    id: string;
    price: string;
    quantity: number;
    language: string;
    condition: string;
    isFoil: boolean;
    isSigned: boolean;
    description: string | null;
    edition: string | null;
    isFirstEdition: boolean;
    grading: string | null;
    card: {
      name: string;
      image: string;
      set: { name: string };
      game: { name: string };
    };
    images: { id: string; url: string; sortOrder: number; isPrimary: boolean }[];
  };
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const [language, setLanguage] = useState(listing.language);
  const [condition, setCondition] = useState(listing.condition);
  const [isFoil, setIsFoil] = useState(listing.isFoil);
  const [isSigned, setIsSigned] = useState(listing.isSigned);
  const [isFirstEdition, setIsFirstEdition] = useState(listing.isFirstEdition);

  // Bilder werden sofort bei jeder Interaktion serverseitig gespeichert
  // (eigenständige Aktionen, siehe image-actions.ts) – unabhängig vom
  // "Speichern"-Button der übrigen Felder weiter unten.
  const [images, setImages] = useState<ImageItem[]>(() =>
    listing.images.map((image) => ({
      kind: "persisted" as const,
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary,
    })),
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isImagesPending, startImageTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UpdateListingFormState>(initialState);
  const [isPending, startTransition] = useTransition();

  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      for (const item of imagesRef.current) {
        if (item.kind === "uploading") {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  const persistedImages = images.filter(
    (item): item is PersistedImage => item.kind === "persisted",
  );
  const uploadingImages = images.filter(
    (item): item is UploadingImage => item.kind === "uploading",
  );

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

    const currentTotal = persistedImages.length + uploadingImages.length;
    let filesToUpload = accepted;
    if (currentTotal + accepted.length > MAX_IMAGES) {
      const allowed = Math.max(0, MAX_IMAGES - currentTotal);
      const overflow = accepted.length - allowed;
      if (overflow > 0) {
        rejected.push(`${overflow} Bild(er) ignoriert (maximal ${MAX_IMAGES})`);
      }
      filesToUpload = accepted.slice(0, allowed);
    }

    setImageError(rejected.length > 0 ? `Nicht übernommen: ${rejected.join(", ")}` : null);

    if (filesToUpload.length === 0) {
      return;
    }

    const uploadingItems: UploadingImage[] = filesToUpload.map((file, index) => ({
      kind: "uploading",
      key: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...uploadingItems]);

    const formData = new FormData();
    for (const file of filesToUpload) {
      formData.append("images", file);
    }

    startImageTransition(async () => {
      const result = await uploadListingImagesAction(listing.id, formData);

      for (const item of uploadingItems) {
        URL.revokeObjectURL(item.previewUrl);
      }

      if (!result.success || !result.images) {
        setImages((prev) => prev.filter((item) => !uploadingItems.includes(item as UploadingImage)));
        setImageError(result.error ?? "Fehler beim Hochladen.");
        return;
      }

      setImages(
        result.images.map((image) => ({
          kind: "persisted" as const,
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
        })),
      );
    });
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

  function replaceImagesFromResult(resultImages: { id: string; url: string; isPrimary: boolean }[]) {
    setImages([
      ...resultImages.map((image) => ({
        kind: "persisted" as const,
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
      })),
      ...uploadingImages,
    ]);
  }

  function handleDelete(imageId: string) {
    setImageError(null);
    startImageTransition(async () => {
      const result = await deleteListingImageAction(listing.id, imageId);
      if (!result.success || !result.images) {
        setImageError(result.error ?? "Fehler beim Löschen.");
        return;
      }
      replaceImagesFromResult(result.images);
    });
  }

  function handleSetPrimary(imageId: string) {
    setImageError(null);
    startImageTransition(async () => {
      const result = await setPrimaryListingImageAction(listing.id, imageId);
      if (!result.success || !result.images) {
        setImageError(result.error ?? "Fehler beim Festlegen des Hauptbilds.");
        return;
      }
      replaceImagesFromResult(result.images);
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= persistedImages.length) {
      return;
    }

    const reordered = [...persistedImages];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setImageError(null);
    setImages([...reordered, ...uploadingImages]);

    startImageTransition(async () => {
      const result = await reorderListingImagesAction(
        listing.id,
        reordered.map((image) => image.id),
      );
      if (!result.success || !result.images) {
        setImageError(result.error ?? "Fehler beim Ändern der Reihenfolge.");
        setImages([...persistedImages, ...uploadingImages]);
        return;
      }
      replaceImagesFromResult(result.images);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateListingAction(listing.id, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="condition" value={condition} />
      <input type="hidden" name="isFoil" value={isFoil ? "true" : "false"} />
      <input type="hidden" name="isSigned" value={isSigned ? "true" : "false"} />
      <input type="hidden" name="isFirstEdition" value={isFirstEdition ? "true" : "false"} />

      {/* Karte – schreibgeschützt, kann nicht geändert werden */}
      <div className="flex items-start gap-4 rounded-md border p-4">
        {listing.card.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
          <img
            src={listing.card.image}
            alt={listing.card.name}
            className="h-28 w-20 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded bg-muted">
            <ImageOff className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{listing.card.name}</p>
          <p className="text-sm text-muted-foreground">{listing.card.set.name}</p>
          <p className="text-sm text-muted-foreground">{listing.card.game.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Preis</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={listing.price}
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
            defaultValue={listing.quantity}
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
            defaultValue={listing.edition ?? ""}
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
            defaultValue={listing.grading ?? ""}
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
        <p className="text-xs text-muted-foreground">
          Änderungen an Bildern werden sofort gespeichert, unabhängig vom
          &quot;Speichern&quot;-Button unten.
        </p>

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
              disabled={isImagesPending}
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

        {images.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {persistedImages.map((image, index) => (
              <li key={image.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- bestehende Bild-URL. */}
                <img
                  src={image.url}
                  alt=""
                  className="aspect-square w-full rounded-md border object-cover"
                />
                {image.isPrimary && (
                  <Badge className="absolute top-1 left-1">Hauptbild</Badge>
                )}
                <button
                  type="button"
                  disabled={isImagesPending}
                  onClick={() => handleDelete(image.id)}
                  aria-label="Bild entfernen"
                  className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background disabled:opacity-40"
                >
                  <X className="size-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <button
                    type="button"
                    disabled={isImagesPending || index === 0}
                    onClick={() => moveImage(index, -1)}
                    aria-label="Bild nach vorne verschieben"
                    className="rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isImagesPending || index === persistedImages.length - 1}
                    onClick={() => moveImage(index, 1)}
                    aria-label="Bild nach hinten verschieben"
                    className="rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background disabled:opacity-40"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
                {!image.isPrimary && (
                  <button
                    type="button"
                    disabled={isImagesPending}
                    onClick={() => handleSetPrimary(image.id)}
                    aria-label="Als Hauptbild festlegen"
                    title="Als Hauptbild festlegen"
                    className="absolute right-1 bottom-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background disabled:opacity-40"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
            {uploadingImages.map((image) => (
              <li key={image.key} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale Objekt-URL für die Vorschau. */}
                <img
                  src={image.previewUrl}
                  alt=""
                  className="aspect-square w-full rounded-md border object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-foreground" />
                </div>
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
          defaultValue={listing.description ?? ""}
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
        {isPending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </form>
  );
}
