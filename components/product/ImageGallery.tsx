"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type ImageGalleryProps = {
  images: string[];
  /** Product title, used for alt text. */
  title: string;
  className?: string;
};

/**
 * Client Component: main image + thumbnail strip.
 * Thumbnails use a roving tabindex: Tab reaches the selected thumbnail, arrow keys / Home / End
 * move between images, and the main image follows the selection.
 */
export function ImageGallery({ images, title, className }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const count = images.length;
  const safeIndex = activeIndex < count ? activeIndex : 0;
  const current = images[safeIndex];

  const select = (index: number, focus = false) => {
    if (count === 0) return;
    const next = (index + count) % count;
    setActiveIndex(next);
    if (focus) thumbRefs.current[next]?.focus();
  };

  const onThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(safeIndex + 1, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(safeIndex - 1, true);
        break;
      case "Home":
        event.preventDefault();
        select(0, true);
        break;
      case "End":
        event.preventDefault();
        select(count - 1, true);
        break;
      default:
        break;
    }
  };

  if (!current) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-400",
          className,
        )}
      >
        No image available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        <Image
          key={current}
          src={current}
          alt={count > 1 ? `${title} - image ${safeIndex + 1} of ${count}` : title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {count > 1 && (
        <div
          role="group"
          aria-label="Product images"
          className="grid grid-cols-5 gap-2 sm:grid-cols-6"
          onKeyDown={onThumbKeyDown}
        >
          {images.map((src, index) => {
            const active = index === safeIndex;
            return (
              <button
                key={`${src}-${index}`}
                ref={(element) => {
                  thumbRefs.current[index] = element;
                }}
                type="button"
                onClick={() => select(index)}
                aria-label={`Show image ${index + 1} of ${count}`}
                aria-pressed={active}
                tabIndex={active ? 0 : -1}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border-2 bg-neutral-100 transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                  active ? "border-neutral-900" : "border-transparent hover:border-neutral-400",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 10vw, 20vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
