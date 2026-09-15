"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductCardData } from "@/types/product";

/**
 * Saved-for-later products, persisted per browser in localStorage. Wishlists are a customer
 * convenience rather than a server record, so there is no API behind this store; the header
 * count, the hearts on product cards and /wishlist all read from here.
 *
 * Render anything derived from it behind `useHydrated()` - the server cannot see localStorage.
 */

export type WishlistItem = Omit<ProductCardData, "rating">;

type WishlistState = {
  items: WishlistItem[];
  /** Add when absent, remove when present. Returns true when the product is now saved. */
  toggle: (product: ProductCardData) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
};

/** Pure toggle used by the store - exported so it can be unit-tested without zustand. */
export function toggleWishlistItem(
  items: readonly WishlistItem[],
  product: ProductCardData,
): { items: WishlistItem[]; saved: boolean } {
  if (items.some((item) => item.id === product.id)) {
    return { items: items.filter((item) => item.id !== product.id), saved: false };
  }
  // Ratings change over time and are re-fetched where shown; keep only what the card needs.
  const item: WishlistItem = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    image: product.image,
    category: product.category,
  };
  return { items: [...items, item], saved: true };
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const next = toggleWishlistItem(get().items, product);
        set({ items: next.items });
        return next.saved;
      },

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "wishlist-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectWishlistCount = (state: WishlistState): number => state.items.length;

export const selectIsWishlisted =
  (productId: string) =>
  (state: WishlistState): boolean =>
    state.items.some((item) => item.id === productId);
