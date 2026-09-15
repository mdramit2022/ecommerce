"use client";

import { HeartFilledIcon, HeartIcon } from "@/components/ui/Icon";
import { selectIsWishlisted, useWishlist } from "@/lib/store/useWishlist";
import { useHydrated } from "@/lib/store/useHydrated";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

export type WishlistButtonProps = {
  product: ProductCardData;
  /** `overlay` floats on the product image; `square` sits beside "Add to Cart". */
  variant?: "overlay" | "square";
  className?: string;
};

/** Toggles a product in the persisted wishlist. Renders unsaved until the store has hydrated. */
export function WishlistButton({ product, variant = "overlay", className }: WishlistButtonProps) {
  const hydrated = useHydrated();
  const saved = useWishlist(selectIsWishlisted(product.id));
  const toggle = useWishlist((state) => state.toggle);
  const active = hydrated && saved;

  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      aria-pressed={active}
      aria-label={
        active ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`
      }
      className={cn(
        "flex items-center justify-center transition",
        variant === "overlay"
          ? "hover:text-brand-red h-8 w-8 rounded-full bg-white/95 text-neutral-500 shadow-sm"
          : "hover:border-brand-red hover:text-brand-red h-8 w-8 rounded-md border border-neutral-300 bg-white text-neutral-500",
        active && "text-brand-red",
        className,
      )}
    >
      {active ? <HeartFilledIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
    </button>
  );
}
