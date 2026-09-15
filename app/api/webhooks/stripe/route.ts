import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { isStripeWebhookConfigured, stripe } from "@/lib/stripe";
import {
  cancelExpiredCheckout,
  fulfillOrderFromCheckoutSession,
  markCheckoutPaymentFailed,
  markPaymentFailed,
  markRefunded,
} from "@/lib/orders/fulfill";

// Signature verification needs the raw request body and Node crypto.
export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe signature, then dispatches the event. Handlers are idempotent so Stripe
 * retries are safe. We return:
 *   - 503 when no webhook secret is configured
 *   - 400 for a missing / invalid signature (Stripe will not retry)
 *   - 200 { data: { received: true } } for handled and unknown events
 *   - 500 only when our own processing fails, so Stripe retries later
 *
 * Local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeWebhookConfigured || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn(
      "[stripe webhook] signature verification failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ data: { received: true } });
  } catch (error) {
    console.error(`[stripe webhook] ${event.type} (${event.id}) failed`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status !== "paid") {
        // Delayed payment methods: wait for checkout.session.async_payment_succeeded.
        console.info(
          `[stripe webhook] ${event.id}: session ${session.id} payment_status=${session.payment_status}, not fulfilling yet`,
        );
        return;
      }
      const result = await fulfillOrderFromCheckoutSession(session);
      console.info(
        `[stripe webhook] ${event.id}: ${result.outcome} (order ${result.orderId ?? "n/a"})`,
      );
      return;
    }

    case "checkout.session.async_payment_failed": {
      const result = await markCheckoutPaymentFailed(event.data.object);
      console.info(
        `[stripe webhook] ${event.id}: async payment failed, order ${result.orderId ?? "n/a"} updated=${result.updated}`,
      );
      return;
    }

    case "checkout.session.expired": {
      const result = await cancelExpiredCheckout(event.data.object);
      console.info(
        `[stripe webhook] ${event.id}: session expired, order ${result.orderId ?? "n/a"} cancelled=${result.cancelled}`,
      );
      return;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      if (!charge.refunded) {
        console.info(
          `[stripe webhook] ${event.id}: partial refund on charge ${charge.id}, order left as PAID`,
        );
        return;
      }
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);
      if (!paymentIntentId) {
        console.warn(`[stripe webhook] ${event.id}: charge ${charge.id} has no payment_intent`);
        return;
      }
      const result = await markRefunded(paymentIntentId, charge.metadata.orderId ?? null);
      console.info(
        `[stripe webhook] ${event.id}: refund for ${paymentIntentId} updated=${result.updated}`,
      );
      return;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const result = await markPaymentFailed(intent.id, intent.metadata.orderId ?? null);
      console.info(
        `[stripe webhook] ${event.id}: payment failed for ${intent.id} updated=${result.updated}`,
      );
      return;
    }

    default:
      // Unhandled event types are acknowledged so Stripe does not keep retrying them.
      return;
  }
}
