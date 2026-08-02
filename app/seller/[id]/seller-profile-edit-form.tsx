"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateSellerProfileAction, type SellerProfileEditFormState } from "./actions";

const initialState: SellerProfileEditFormState = { success: false, errors: {} };

export interface SellerProfileEditFormInitialValues {
  sellerId: string;
  shortDescription: string;
  longDescription: string;
  companyName: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  discordUrl: string;
  location: string;
  shippingCountries: string[];
  shippingTime: string;
  responseTime: string;
  shopRules: string;
  returnPolicy: string;
}

interface SellerProfileEditFormProps {
  initial: SellerProfileEditFormInitialValues;
}

export function SellerProfileEditForm({ initial }: SellerProfileEditFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateSellerProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        Profil bearbeiten
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-lg border p-4">
      <input type="hidden" name="sellerId" value={initial.sellerId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bannerImage">Bannerbild</Label>
          <Input id="bannerImage" name="bannerImage" type="file" accept="image/jpeg,image/png,image/webp" disabled={isPending} />
          {state.errors.bannerImage && <p className="text-sm text-destructive">{state.errors.bannerImage}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Profilbild</Label>
          <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={isPending} />
          {state.errors.avatar && <p className="text-sm text-destructive">{state.errors.avatar}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Kurzbeschreibung</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          maxLength={200}
          defaultValue={initial.shortDescription}
          disabled={isPending}
          aria-invalid={!!state.errors.shortDescription}
        />
        {state.errors.shortDescription && (
          <p className="text-sm text-destructive">{state.errors.shortDescription}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="longDescription">Lange Beschreibung</Label>
        <Textarea
          id="longDescription"
          name="longDescription"
          rows={5}
          maxLength={3000}
          defaultValue={initial.longDescription}
          disabled={isPending}
          aria-invalid={!!state.errors.longDescription}
        />
        {state.errors.longDescription && (
          <p className="text-sm text-destructive">{state.errors.longDescription}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Firmenname</Label>
          <Input id="companyName" name="companyName" maxLength={100} defaultValue={initial.companyName} disabled={isPending} />
          {state.errors.companyName && <p className="text-sm text-destructive">{state.errors.companyName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Standort</Label>
          <Input id="location" name="location" maxLength={100} defaultValue={initial.location} disabled={isPending} />
          {state.errors.location && <p className="text-sm text-destructive">{state.errors.location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={initial.website} disabled={isPending} placeholder="https://…" />
          {state.errors.website && <p className="text-sm text-destructive">{state.errors.website}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram</Label>
          <Input id="instagramUrl" name="instagramUrl" type="url" defaultValue={initial.instagramUrl} disabled={isPending} placeholder="https://instagram.com/…" />
          {state.errors.instagramUrl && <p className="text-sm text-destructive">{state.errors.instagramUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebookUrl">Facebook</Label>
          <Input id="facebookUrl" name="facebookUrl" type="url" defaultValue={initial.facebookUrl} disabled={isPending} placeholder="https://facebook.com/…" />
          {state.errors.facebookUrl && <p className="text-sm text-destructive">{state.errors.facebookUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">YouTube</Label>
          <Input id="youtubeUrl" name="youtubeUrl" type="url" defaultValue={initial.youtubeUrl} disabled={isPending} placeholder="https://youtube.com/…" />
          {state.errors.youtubeUrl && <p className="text-sm text-destructive">{state.errors.youtubeUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discordUrl">Discord</Label>
          <Input id="discordUrl" name="discordUrl" type="url" defaultValue={initial.discordUrl} disabled={isPending} placeholder="https://discord.gg/…" />
          {state.errors.discordUrl && <p className="text-sm text-destructive">{state.errors.discordUrl}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingCountries">Versandländer (kommagetrennt)</Label>
          <Input
            id="shippingCountries"
            name="shippingCountries"
            defaultValue={initial.shippingCountries.join(", ")}
            disabled={isPending}
            placeholder="Schweiz, Deutschland, Österreich"
          />
          {state.errors.shippingCountries && (
            <p className="text-sm text-destructive">{state.errors.shippingCountries}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippingTime">Versandzeit</Label>
          <Input id="shippingTime" name="shippingTime" maxLength={100} defaultValue={initial.shippingTime} disabled={isPending} placeholder="2-3 Werktage" />
          {state.errors.shippingTime && <p className="text-sm text-destructive">{state.errors.shippingTime}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="responseTime">Antwortzeit</Label>
          <Input id="responseTime" name="responseTime" maxLength={100} defaultValue={initial.responseTime} disabled={isPending} placeholder="Innerhalb 24 Stunden" />
          {state.errors.responseTime && <p className="text-sm text-destructive">{state.errors.responseTime}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shopRules">Shop-Regeln</Label>
        <Textarea
          id="shopRules"
          name="shopRules"
          rows={4}
          maxLength={2000}
          defaultValue={initial.shopRules}
          disabled={isPending}
        />
        {state.errors.shopRules && <p className="text-sm text-destructive">{state.errors.shopRules}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="returnPolicy">Rückgabebedingungen</Label>
        <Textarea
          id="returnPolicy"
          name="returnPolicy"
          rows={4}
          maxLength={2000}
          defaultValue={initial.returnPolicy}
          disabled={isPending}
        />
        {state.errors.returnPolicy && <p className="text-sm text-destructive">{state.errors.returnPolicy}</p>}
      </div>

      {state.errors.form && <p className="text-sm text-destructive">{state.errors.form}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={() => setIsOpen(false)}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
