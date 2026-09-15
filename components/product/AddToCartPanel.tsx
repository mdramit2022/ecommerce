"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useCart } from "@/lib/store/useCart";
import { useHydrated } from "@/lib/store/useHydrated";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

export type AddToCartPanelProps = {
  product: ProductCardData;
  className?: string;
};

const stepperButtonClass =
  "flex h-11 w-11 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent";

/**
 * Client Component: quantity stepper (clamped to 1..stock) wrapping the shared AddToCartButton.
 */
export function AddToCartPanel({ product, className }: AddToCartPanelProps) {
  const outOfStock = product.stock <= 0;
  const max = Math.max(1, product.stock);
  const clamp = (value: number) => Math.min(Math.max(Math.trunc(value) || 1, 1), max);

  // Keep the raw string so the user can clear the field while typing; clamp on read and on blur.
  const [raw, setRaw] = useState("1");
  const quantity = clamp(Number(raw));

  const hydrated = useHydrated();
  const inCartQty = useCart(
    (state) => state.items.find((line) => line.productId === product.id)?.quantity ?? 0,
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="quantity" className="text-sm font-medium text-neutral-800">
          Quantity
        </label>
        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white">
          <button
            type="button"
            onClick={() => setRaw(String(clamp(quantity - 1)))}
            disabled={outOfStock || quantity <= 1}
            aria-label="Decrease quantity"
            className={stepperButtonClass}
          >
            -
          </button>
          <input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            step={1}
            value={outOfStock ? "0" : raw}
            onChange={(event) => setRaw(event.target.value)}
            onBlur={() => setRaw(String(quantity))}
            disabled={outOfStock}
            aria-describedby="quantity-hint"
            className="w-14 [appearance:textfield] border-x border-neutral-300 text-center text-sm text-neutral-900 outline-none focus:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setRaw(String(clamp(quantity + 1)))}
            disabled={outOfStock || quantity >= max}
            aria-label="Increase quantity"
            className={stepperButtonClass}
          >
            +
          </button>
        </div>
        <p id="quantity-hint" className="text-xs text-neutral-500">
          {outOfStock ? "Currently unavailable" : `Up to ${product.stock} available`}
        </p>
      </div>

      <AddToCartButton product={product} quantity={quantity} className="mt-0 h-12 text-base" />

      {hydrated && inCartQty > 0 && (
        <p className="text-xs text-neutral-500" aria-live="polite">
          {inCartQty} already in your cart{inCartQty >= product.stock ? " (maximum reached)" : ""}.
        </p>
      )}
    </div>
  );
}
