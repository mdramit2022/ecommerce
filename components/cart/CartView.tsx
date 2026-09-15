"use client";

import Link from "next/link";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CheckoutButton } from "@/components/cart/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { selectItemCount, selectSubtotal, useCart } from "@/lib/store/useCart";
import { useHydrated } from "@/lib/store/useHydrated";
import { formatPrice } from "@/lib/utils";

export type CartViewProps = {
  /** Labels of the payment methods on offer, read on the server and passed down. */
  paymentMethodLabels: string[];
};

const continueShoppingClasses =
  "inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

/**
 * Client Component: renders the persisted cart. Waits for hydration so the server-rendered
 * markup (which cannot see localStorage) never mismatches the client.
 */
export function CartView({ paymentMethodLabels }: CartViewProps) {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const itemCount = useCart(selectItemCount);
  const subtotal = useCart(selectSubtotal);
  const clearCart = useCart((state) => state.clearCart);

  if (!hydrated) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Looks like you have not added anything yet."
        action={
          <Link href="/" className={continueShoppingClasses}>
            Continue shopping
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section
        aria-label="Cart items"
        className="rounded-xl border border-neutral-200 bg-white shadow-sm"
      >
        <ul className="divide-y divide-neutral-200">
          {items.map((line) => (
            <CartLineItem key={line.productId} line={line} />
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 sm:px-5">
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            Continue shopping
          </Link>
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear cart
          </Button>
        </div>
      </section>

      <Card className="lg:sticky lg:top-6" aria-label="Order summary">
        <h2 className="text-base font-semibold text-neutral-900">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-600">
              Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </dt>
            <dd className="font-medium text-neutral-900" aria-live="polite">
              {formatPrice(subtotal)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral-500">Shipping and taxes calculated at checkout.</p>
        <CheckoutButton paymentMethodLabels={paymentMethodLabels} className="mt-6" />
      </Card>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
      aria-busy="true"
      aria-label="Loading cart"
    >
      <div className="animate-pulse divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex gap-4 p-4 sm:p-5">
            <div className="h-24 w-24 shrink-0 rounded-lg bg-neutral-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-3 w-1/4 rounded bg-neutral-200" />
              <div className="h-8 w-32 rounded-lg bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  );
}
