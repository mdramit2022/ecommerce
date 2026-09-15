"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart, type CartLine } from "@/lib/store/useCart";
import { cn, formatPrice } from "@/lib/utils";

export type CartLineItemProps = {
  line: CartLine;
};

/** One row of the cart: thumbnail, title, unit price, quantity stepper, remove, line total. */
export function CartLineItem({ line }: CartLineItemProps) {
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);

  const href = `/products/${line.slug}`;
  const outOfStock = line.stock <= 0;
  const atLimit = !outOfStock && line.quantity >= line.stock;
  const lineTotal = Math.round(line.price * line.quantity * 100) / 100;

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link
        href={href}
        aria-label={line.title}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
      >
        {line.image ? (
          <Image src={line.image} alt={line.title} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-neutral-900">
            <Link href={href} className="hover:underline">
              {line.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{formatPrice(line.price)} each</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <QuantityStepper
              label={line.title}
              quantity={line.quantity}
              max={line.stock}
              disabled={outOfStock}
              onChange={(quantity) => updateQuantity(line.productId, quantity)}
            />
            <Button variant="ghost" size="sm" onClick={() => removeItem(line.productId)}>
              Remove
            </Button>
          </div>

          {atLimit && (
            <p className="mt-2 text-xs text-amber-700" role="status">
              Only {line.stock} available
            </p>
          )}
          {outOfStock && (
            <p className="mt-2 text-xs text-rose-600" role="status">
              Out of stock - remove this item to continue
            </p>
          )}
        </div>

        <p className="text-sm font-semibold text-neutral-900 sm:text-right">
          {formatPrice(lineTotal)}
        </p>
      </div>
    </li>
  );
}

type QuantityStepperProps = {
  label: string;
  quantity: number;
  /** Available stock. `+` is disabled at this value. */
  max: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
};

const stepButtonClasses =
  "h-8 w-8 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent";

function QuantityStepper({
  label,
  quantity,
  max,
  disabled = false,
  onChange,
}: QuantityStepperProps) {
  // `null` = not editing; the input shows the store value. Avoids syncing state in an effect.
  const [draft, setDraft] = useState<string | null>(null);

  const canDecrement = !disabled && quantity > 1;
  const canIncrement = !disabled && quantity < max;

  const commit = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(parsed) && parsed >= 1) onChange(parsed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      setDraft(null);
    }
  };

  return (
    <div
      role="group"
      aria-label={`Quantity for ${label}`}
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border border-neutral-300 bg-white",
        disabled && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={!canDecrement}
        onClick={() => onChange(quantity - 1)}
        className={stepButtonClasses}
      >
        -
      </button>
      <Input
        aria-label="Quantity"
        inputMode="numeric"
        pattern="[0-9]*"
        min={1}
        max={Math.max(max, 1)}
        disabled={disabled}
        value={draft ?? String(quantity)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-8 w-12 rounded-none border-0 px-0 text-center focus:ring-0"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={!canIncrement}
        onClick={() => onChange(quantity + 1)}
        className={stepButtonClasses}
      >
        +
      </button>
    </div>
  );
}
