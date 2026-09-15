"use client";

import Link from "next/link";
import { ShoppingCartIcon } from "@/components/ui/Icon";
import { selectItemCount, useCart } from "@/lib/store/useCart";
import { useHydrated } from "@/lib/store/useHydrated";
import { cn } from "@/lib/utils";

export type CartBadgeProps = {
  /** `labelled` shows the "Cart" caption under the icon (desktop header); `icon` is icon-only. */
  variant?: "labelled" | "icon";
  className?: string;
};

/** Header cart link with a live item count from the persisted Zustand store. */
export function CartBadge({ variant = "labelled", className }: CartBadgeProps) {
  const hydrated = useHydrated();
  const count = useCart(selectItemCount);

  return (
    <Link
      href="/cart"
      aria-label={hydrated && count > 0 ? `Cart, ${count} items` : "Cart"}
      className={cn(
        "hover:text-brand-blue relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-neutral-800 transition",
        className,
      )}
    >
      <span className="relative">
        <ShoppingCartIcon className="h-6 w-6" />
        {hydrated && count > 0 && (
          <span
            aria-hidden="true"
            className="bg-brand-red absolute -top-1.5 -right-2 inline-flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold text-white"
          >
            {count}
          </span>
        )}
      </span>
      {variant === "labelled" && <span className="text-[11px] font-medium">Cart</span>}
    </Link>
  );
}
