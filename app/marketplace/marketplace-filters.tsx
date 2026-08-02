"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { CONDITIONS, LANGUAGES } from "@/lib/validation/listing";
import type {
  MarketplaceFilterOptions,
  MarketplaceSellerType,
  MarketplaceSort,
} from "@/services/marketplace/searchMarketplace";
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// shadcn Select erlaubt keinen leeren String als Item-Value.
const ALL_VALUE = "__all__";

export interface MarketplaceFiltersInitialValues {
  search: string;
  cardName: string;
  cardNumber: string;
  game: string;
  set: string;
  language: string;
  condition: string;
  foil: boolean;
  edition: string;
  firstEdition: boolean;
  grading: string;
  seller: string;
  verified: boolean;
  sellerType: MarketplaceSellerType | undefined;
  minPrice: string;
  maxPrice: string;
  available: boolean;
  activeOnly: boolean;
  sort: MarketplaceSort;
}

interface MarketplaceFiltersProps {
  filterOptions: MarketplaceFilterOptions;
  initial: MarketplaceFiltersInitialValues;
}

export function MarketplaceFilters({ filterOptions, initial }: MarketplaceFiltersProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initial.search);
  const [cardName, setCardName] = useState(initial.cardName);
  const [cardNumber, setCardNumber] = useState(initial.cardNumber);
  const [game, setGame] = useState(initial.game || ALL_VALUE);
  const [setCode, setSetCode] = useState(initial.set || ALL_VALUE);
  const [language, setLanguage] = useState(initial.language || ALL_VALUE);
  const [condition, setCondition] = useState(initial.condition || ALL_VALUE);
  const [foil, setFoil] = useState(initial.foil);
  const [edition, setEdition] = useState(initial.edition || ALL_VALUE);
  const [firstEdition, setFirstEdition] = useState(initial.firstEdition);
  const [grading, setGrading] = useState(initial.grading || ALL_VALUE);
  const [seller, setSeller] = useState(initial.seller);
  const [verified, setVerified] = useState(initial.verified);
  const [sellerType, setSellerType] = useState<MarketplaceSellerType | typeof ALL_VALUE>(
    initial.sellerType ?? ALL_VALUE,
  );
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
  const [available, setAvailable] = useState(initial.available);
  const [activeOnly, setActiveOnly] = useState(initial.activeOnly);
  const [sort, setSort] = useState<MarketplaceSort>(initial.sort);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const availableSets =
    game === ALL_VALUE
      ? filterOptions.sets
      : filterOptions.sets.filter((set) => set.gameSlug === game);

  const activeFilterCount = [
    search.trim(),
    cardName.trim(),
    cardNumber.trim(),
    game !== ALL_VALUE,
    setCode !== ALL_VALUE,
    language !== ALL_VALUE,
    condition !== ALL_VALUE,
    foil,
    edition !== ALL_VALUE,
    firstEdition,
    grading !== ALL_VALUE,
    seller.trim(),
    verified,
    sellerType !== ALL_VALUE,
    minPrice.trim(),
    maxPrice.trim(),
    available,
    !activeOnly,
  ].filter(Boolean).length;

  function applyFilters() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (cardName.trim()) params.set("cardName", cardName.trim());
    if (cardNumber.trim()) params.set("cardNumber", cardNumber.trim());
    if (game !== ALL_VALUE) params.set("game", game);
    if (setCode !== ALL_VALUE) params.set("set", setCode);
    if (language !== ALL_VALUE) params.set("language", language);
    if (condition !== ALL_VALUE) params.set("condition", condition);
    if (foil) params.set("foil", "true");
    if (edition !== ALL_VALUE) params.set("edition", edition);
    if (firstEdition) params.set("firstEdition", "true");
    if (grading !== ALL_VALUE) params.set("grading", grading);
    if (seller.trim()) params.set("seller", seller.trim());
    if (verified) params.set("verified", "true");
    if (sellerType !== ALL_VALUE) params.set("sellerType", sellerType);
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (available) params.set("available", "true");
    if (!activeOnly) params.set("activeOnly", "false");
    if (sort !== "newest") params.set("sort", sort);

    const qs = params.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
    setIsSheetOpen(false);
  }

  function resetFilters() {
    router.push("/marketplace");
    setIsSheetOpen(false);
  }

  const filterFields = (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="search">Suche</Label>
        <Input
          id="search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyFilters();
            }
          }}
          placeholder="Karte, Set, Nummer, Edition, Verkäufer…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardName">Kartenname</Label>
        <Input
          id="cardName"
          value={cardName}
          onChange={(event) => setCardName(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Kartennummer</Label>
        <Input
          id="cardNumber"
          value={cardNumber}
          onChange={(event) => setCardNumber(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Kartenspiel</Label>
        <Select
          value={game}
          onValueChange={(value) => {
            setGame(value);
            setSetCode(ALL_VALUE);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Spiele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Spiele</SelectItem>
            {filterOptions.games.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Set</Label>
        <Select value={setCode} onValueChange={setSetCode}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Sets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Sets</SelectItem>
            {availableSets.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Sprache</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Sprachen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Sprachen</SelectItem>
            {LANGUAGES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Zustand</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Zustände" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Zustände</SelectItem>
            {CONDITIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Edition</Label>
        <Select value={edition} onValueChange={setEdition}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Editionen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Editionen</SelectItem>
            {filterOptions.editions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Grading</Label>
        <Select value={grading} onValueChange={setGrading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle (auch ungraded)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle (auch ungraded)</SelectItem>
            {filterOptions.gradings.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seller">Verkäufer</Label>
        <Input
          id="seller"
          value={seller}
          onChange={(event) => setSeller(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Verkäufertyp</Label>
        <Select
          value={sellerType}
          onValueChange={(value) => setSellerType(value as MarketplaceSellerType | typeof ALL_VALUE)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Alle Verkäufer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Verkäufer</SelectItem>
            <SelectItem value="commercial">Nur gewerbliche Verkäufer</SelectItem>
            <SelectItem value="private">Nur private Verkäufer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minPrice">Preis von</Label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            step="0.01"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">Preis bis</Label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            step="0.01"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Sortierung</Label>
        <Select value={sort} onValueChange={(value) => setSort(value as MarketplaceSort)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste</SelectItem>
            <SelectItem value="price_asc">Preis aufsteigend</SelectItem>
            <SelectItem value="price_desc">Preis absteigend</SelectItem>
            <SelectItem value="popular">Beliebteste</SelectItem>
            <SelectItem value="alphabetical">Alphabetisch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="foil"
            checked={foil}
            onCheckedChange={(checked) => setFoil(checked === true)}
          />
          <Label htmlFor="foil" className="font-normal">
            Nur Foil
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="firstEdition"
            checked={firstEdition}
            onCheckedChange={(checked) => setFirstEdition(checked === true)}
          />
          <Label htmlFor="firstEdition" className="font-normal">
            Nur First Edition
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="verified"
            checked={verified}
            onCheckedChange={(checked) => setVerified(checked === true)}
          />
          <Label htmlFor="verified" className="font-normal">
            Nur verifizierte Verkäufer
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="available"
            checked={available}
            onCheckedChange={(checked) => setAvailable(checked === true)}
          />
          <Label htmlFor="available" className="font-normal">
            Nur verfügbare Angebote
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="activeOnly"
            checked={activeOnly}
            onCheckedChange={(checked) => setActiveOnly(checked === true)}
          />
          <Label htmlFor="activeOnly" className="font-normal">
            Nur aktive Listings
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistente Sidebar */}
      <aside className="hidden md:block">
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          {filterFields}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={applyFilters} className="flex-1">
              Filter anwenden
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Zurücksetzen
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile: Bottom Sheet, per Trigger-Button geöffnet */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <SlidersHorizontal className="size-4" />
              Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4">{filterFields}</div>
            <SheetFooter className="flex-row">
              <Button onClick={applyFilters} className="flex-1">
                Filter anwenden
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Zurücksetzen
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
