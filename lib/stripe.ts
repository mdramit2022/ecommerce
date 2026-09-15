import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Stripe singleton (server only). Never import from a Client Component.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
  appInfo: { name: "ecommerce", version: "0.1.0" },
});

/**
 * `.env.example` ships with placeholder keys so the app boots without a Stripe account.
 * Payment endpoints use this flag to return a clear 503 instead of a Stripe auth error.
 */
export const isStripeConfigured =
  !env.STRIPE_SECRET_KEY.includes("REPLACE_ME") && env.STRIPE_SECRET_KEY.length > 20;

export const isStripeWebhookConfigured =
  typeof env.STRIPE_WEBHOOK_SECRET === "string" &&
  !env.STRIPE_WEBHOOK_SECRET.includes("REPLACE_ME");

/** Convert a 2-dp decimal amount (as number) to integer minor units for Stripe. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert Stripe integer minor units back to a 2-dp decimal number. */
export function fromMinorUnits(amount: number): number {
  return Math.round(amount) / 100;
}
