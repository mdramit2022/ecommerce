import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { isEmailConfigured } from "@/lib/email";
import { orderDetailSelect, toOrderDetail, type OrderDetailRow } from "@/lib/orders/serialize";
import { fulfillOrderFromCheckoutSession } from "@/lib/orders/fulfill";
import { getPaymentMethod } from "@/lib/payments/methods";
import { checkoutSuccessQuerySchema } from "@/lib/validations/checkout";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { PaymentInstructions } from "@/components/checkout/PaymentInstructions";
import { ClearCartOnSuccess } from "@/components/checkout/ClearCartOnSuccess";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

// Depends on the query string and on live order state.
export const dynamic = "force-dynamic";

type CheckoutSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const linkButton =
  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function loadOrderBySession(sessionId: string): Promise<OrderDetailRow | null> {
  return prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: orderDetailSelect,
  });
}

/**
 * Finish a Stripe checkout: the webhook normally fulfils the order first, but if it has not
 * arrived yet (local dev without `stripe listen`, or plain latency) ask Stripe directly.
 */
async function resolveStripeOrder(sessionId: string): Promise<OrderDetailRow | null> {
  let row = await loadOrderBySession(sessionId);
  if (row && row.paymentStatus !== "UNPAID") return row;
  if (!isStripeConfigured) return row;

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkoutSession.payment_status === "paid") {
      // Also links the session id to the order when it was missing.
      await fulfillOrderFromCheckoutSession(checkoutSession);
      row = (await loadOrderBySession(sessionId)) ?? row;
    }
    if (!row) {
      // Still unpaid and never linked: show the order Stripe references while payment settles.
      const fallbackId = checkoutSession.metadata?.orderId ?? checkoutSession.client_reference_id;
      if (fallbackId) {
        row = await prisma.order.findUnique({
          where: {
            id: fallbackId,
            OR: [{ stripeSessionId: null }, { stripeSessionId: sessionId }],
          },
          select: orderDetailSelect,
        });
      }
    }
  } catch (error) {
    // Not fatal: the page still renders and the webhook will finish the job.
    console.error(`[checkout/success] could not confirm session ${sessionId}`, error);
  }

  return row;
}

/**
 * Server Component. Reached two ways:
 *
 *   - `?session_id=cs_...` - Stripe redirects here after a card payment.
 *   - `?order_id=<cuid>`   - an order placed with a manual method (cash on delivery, eSewa,
 *     IME Pay, bank transfer), which is already in the database when the customer arrives.
 */
export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const parsed = checkoutSuccessQuerySchema.safeParse({
    session_id: first(params.session_id),
    order_id: first(params.order_id),
  });
  if (!parsed.success) redirect("/");

  const { session_id: sessionId, order_id: orderId } = parsed.data;

  const row = sessionId
    ? await resolveStripeOrder(sessionId)
    : orderId
      ? await prisma.order.findUnique({ where: { id: orderId }, select: orderDetailSelect })
      : null;

  if (!row) notFound();

  const session = await auth();

  // An order that belongs to an account is only visible to that account (admins may look at any).
  if (row.userId && row.userId !== session?.user?.id && session?.user?.role !== "ADMIN") {
    notFound();
  }

  const order = toOrderDetail(row);
  const method = getPaymentMethod(order.paymentMethod);
  const isPaid = order.paymentStatus === "PAID";
  const awaitingCard =
    !method.manual && order.status === "PENDING" && order.paymentStatus === "UNPAID";
  const isFailed = order.paymentStatus === "FAILED" || order.status === "CANCELLED";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ClearCartOnSuccess />

      <header className="mb-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Thank you</h1>
        <p className="mt-2 text-neutral-600">
          {isPaid ? "Your order has been received." : "We have received your order."} Order number{" "}
          <span className="font-mono font-medium text-neutral-900">{order.orderNumber}</span>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </header>

      {awaitingCard && (
        <Alert tone="info" title="Payment is being confirmed" className="mb-6">
          Stripe is still confirming your payment - refresh this page in a moment. You will also
          receive an email once it goes through.
        </Alert>
      )}

      {isFailed && !method.manual && (
        <Alert tone="warning" title="Payment not completed" className="mb-6">
          This order&apos;s payment did not go through. Your cart is unaffected - you can return to
          it and try again.
        </Alert>
      )}

      <PaymentInstructions order={order} className="mb-6" />

      {isPaid && isEmailConfigured && !order.email.includes("@checkout") && (
        <p className="mb-6 text-center text-sm text-neutral-500">
          A confirmation has been sent to{" "}
          <span className="font-medium text-neutral-700">{order.email}</span>.
        </p>
      )}

      <OrderSummaryCard order={order} />

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {session?.user && (
          <Link
            href="/account/orders"
            className={`${linkButton} bg-neutral-900 text-white hover:bg-neutral-700`}
          >
            View your orders
          </Link>
        )}
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
