import type { Metadata } from "next";
import Link from "next/link";
import { abandonCheckout } from "@/lib/orders/fulfill";
import { checkoutCancelQuerySchema } from "@/lib/validations/checkout";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

// Reads the query string and cancels the abandoned order - never cache.
export const dynamic = "force-dynamic";

type CheckoutCancelPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const linkButton =
  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

/**
 * Server Component. Stripe sends the customer here when they back out of Checkout
 * (`cancel_url`). The pending order created by POST /api/checkout is cancelled so abandoned
 * orders do not accumulate; the local cart is untouched so the customer can retry.
 */
export default async function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const params = await searchParams;
  const rawOrderId = Array.isArray(params.order_id) ? params.order_id[0] : params.order_id;
  const parsed = checkoutCancelQuerySchema.safeParse({ order_id: rawOrderId });

  if (parsed.success && parsed.data.order_id) {
    try {
      await abandonCheckout(parsed.data.order_id);
    } catch (error) {
      // Cosmetic cleanup only - never block the page on it.
      console.error(`[checkout/cancel] could not cancel order ${parsed.data.order_id}`, error);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Checkout cancelled</h1>
      <p className="mt-3 text-neutral-600">
        No payment was taken. Your cart has been kept exactly as it was, so you can review it and
        check out again whenever you are ready.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/cart"
          className={`${linkButton} bg-neutral-900 text-white hover:bg-neutral-700`}
        >
          Back to cart
        </Link>
        <Link
          href="/"
          className={`${linkButton} border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900`}
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
