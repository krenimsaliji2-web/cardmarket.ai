"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface ListingGalleryImage {
  id: string;
  url: string;
}

interface ListingGalleryProps {
  images: ListingGalleryImage[];
  alt: string;
}

export function ListingGallery({ images, alt }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="aspect-5/7 overflow-hidden rounded-lg border bg-muted">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
          <img
            src={activeImage.url}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-10" />
            <span className="text-sm">Kein Bild</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Bild ${index + 1} anzeigen`}
              aria-current={index === activeIndex}
              className={cn(
                "aspect-5/7 overflow-hidden rounded-md border-2 transition-colors",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL. */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
