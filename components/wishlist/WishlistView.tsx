"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { ProductCard } from "@/components/product/ProductCard";
import { useWishlist } from "@/lib/store/useWishlist";
import { useHydrated } from "@/lib/store/useHydrated";

/**
 * Client Component: the saved products, straight from the persisted store. Waits for hydration
 * so the server-rendered shell (which cannot see localStorage) never mismatches.
 */
export function WishlistView() {
  const hydrated = useHydrated();
  const items = useWishlist((state) => state.items);
  const clear = useWishlist((state) => state.clear);

  if (!hydrated) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading wishlist"
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-xl border border-neutral-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={
          <Link
            href="/shop"
            className="bg-brand-blue hover:bg-brand-blue-dark inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {items.length} saved {items.length === 1 ? "item" : "items"}
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear wishlist
        </Button>
      </div>
      <section
        aria-label="Saved products"
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </section>
    </>
  );
}
