"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/useCart";
import { cn } from "@/lib/utils";

export type CheckoutButtonProps = {
  /** Labels of the payment methods this deployment accepts, for the note under the button. */
  paymentMethodLabels: string[];
  className?: string;
};

const buttonClasses =
  "inline-flex h-12 w-full items-center justify-center rounded-lg px-6 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

/**
 * Sends the customer to /checkout, where the address and payment method are chosen.
 * Disabled while the cart is empty or contains a sold-out line, which checkout would reject.
 */
export function CheckoutButton({ paymentMethodLabels, className }: CheckoutButtonProps) {
  const items = useCart((state) => state.items);
  const soldOut = items.filter((line) => line.stock <= 0);
  const disabled = items.length === 0 || soldOut.length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {disabled ? (
        <span
          aria-disabled="true"
          className={cn(buttonClasses, "cursor-not-allowed bg-neutral-900 text-white opacity-60")}
        >
          Proceed to checkout
        </span>
      ) : (
        <Link
          href="/checkout"
          className={cn(buttonClasses, "bg-neutral-900 text-white hover:bg-neutral-700")}
        >
          Proceed to checkout
        </Link>
      )}

      {soldOut.length > 0 && (
        <p role="status" className="text-xs text-rose-600">
          Remove {soldOut.map((line) => line.title).join(", ")} to continue.
        </p>
      )}

      {paymentMethodLabels.length > 0 && (
        <p className="text-xs text-neutral-500">Pay with {paymentMethodLabels.join(", ")}.</p>
      )}
    </div>
  );
}
