import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { PageHeader } from "@/components/ui/Card";
import { listPaymentMethods } from "@/lib/payments/methods";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the items in your cart before checkout.",
};

/**
 * Server Component. The cart itself lives in the client (persisted Zustand store), so this page
 * only supplies server-known configuration and renders the client view.
 */
export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Your cart" description="Review your items before checking out." />
      <CartView
        paymentMethodLabels={listPaymentMethods({
          stripeConfigured: isStripeConfigured,
        }).map((method) => method.label)}
      />
    </main>
  );
}
