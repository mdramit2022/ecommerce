"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/ui/Icon";
import { selectWishlistCount, useWishlist } from "@/lib/store/useWishlist";
import { useHydrated } from "@/lib/store/useHydrated";
import { cn } from "@/lib/utils";

export type WishlistLinkProps = { className?: string };

/** Header link to /wishlist with a live count from the persisted store. */
export function WishlistLink({ className }: WishlistLinkProps) {
  const hydrated = useHydrated();
  const count = useWishlist(selectWishlistCount);

  return (
    <Link
      href="/wishlist"
      className={cn(
        "text-brand-blue-dark hover:text-brand-blue relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition",
        className,
      )}
    >
      <span className="relative">
        <HeartIcon className="h-6 w-6" />
        {hydrated && count > 0 && (
          <span
            aria-label={`${count} items in wishlist`}
            className="bg-brand-red absolute -top-1.5 -right-2 inline-flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold text-white"
          >
            {count}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium">Wishlist</span>
    </Link>
  );
}
