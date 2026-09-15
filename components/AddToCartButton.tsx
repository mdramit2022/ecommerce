"use client";

import { useState } from "react";
import { useCart } from "@/lib/store/useCart";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

export type AddToCartButtonProps = {
  product: ProductCardData;
  quantity?: number;
  /** `sm` is the compact card button; `md` the default. */
  size?: "sm" | "md";
  className?: string;
};

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className,
}: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem);
  const inCartQty = useCart(
    (state) => state.items.find((line) => line.productId === product.id)?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState(false);

  const disabled = product.stock <= 0 || inCartQty >= product.stock;

  const handleClick = () => {
    if (disabled) return;
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      className={cn(
        "inline-flex w-full items-center justify-center rounded-md font-medium transition",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        "bg-brand-blue hover:bg-brand-blue-dark focus-visible:outline-brand-blue text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500",
        justAdded && "bg-emerald-600 hover:bg-emerald-600",
        className,
      )}
    >
      {product.stock <= 0 ? "Out of stock" : justAdded ? "Added" : "Add to Cart"}
    </button>
  );
}
