import type { PaymentMethod } from "@prisma/client";

/**
 * Catalogue of the payment methods the storefront offers.
 *
 * Pure data + pure functions: no env, Prisma or Stripe imports, so this module is safe to import
 * from Client Components, Server Components, Route Handlers and tests alike.
 *
 * Only `STRIPE` is settled online (Checkout Session + webhook, see `lib/orders/fulfill.ts`).
 * Every other method is *manual*: the order is placed immediately and an admin confirms the money
 * later from `/admin/orders/[id]` (see `lib/admin/orders.ts#updateOrderPaymentStatus`).
 *
 * The account numbers below are demo values - replace them with the real merchant details
 * before running this store for anyone but yourself (see `docs/RUNBOOK.md`).
 */

/** Display order of the methods in the checkout menu. */
export const PAYMENT_METHOD_VALUES = [
  "CASH_ON_DELIVERY",
  "ESEWA",
  "IME_PAY",
  "BANK_TRANSFER",
  "STRIPE",
] as const satisfies readonly PaymentMethod[];

export type PaymentMethodConfig = {
  value: PaymentMethod;
  /** Name shown in the checkout menu. */
  label: string;
  /** One line under the label in the menu. */
  tagline: string;
  /** Short label for tables and badges. */
  badge: string;
  /** Confirmed by a human instead of by a payment provider. */
  manual: boolean;
  /** The customer must supply a transaction id when placing the order. */
  requiresReference: boolean;
  referenceLabel: string | null;
  referenceHint: string | null;
  /** What the customer still has to do, shown on the confirmation page and in the email. */
  instructions: readonly string[];
};

const CONFIGS: Record<PaymentMethod, PaymentMethodConfig> = {
  CASH_ON_DELIVERY: {
    value: "CASH_ON_DELIVERY",
    label: "Cash on delivery",
    tagline: "Pay the courier in cash when your parcel arrives.",
    badge: "COD",
    manual: true,
    requiresReference: false,
    referenceLabel: null,
    referenceHint: null,
    instructions: [
      "Keep the exact amount ready - our courier collects it at your door.",
      "We will call the phone number on this order before delivery.",
      "Your order ships once we confirm it; payment is recorded on delivery.",
    ],
  },
  ESEWA: {
    value: "ESEWA",
    label: "eSewa",
    tagline: "Send the total from your eSewa wallet and enter the transaction code.",
    badge: "eSewa",
    manual: true,
    requiresReference: true,
    referenceLabel: "eSewa transaction code",
    referenceHint: "The code in your eSewa receipt, e.g. 0AB1CD2",
    instructions: [
      "Send the order total to the eSewa merchant ID 9800000000 (Demo Store).",
      "Use your order number as the remark so we can match the payment.",
      "We verify eSewa transfers on business days, usually within a few hours.",
    ],
  },
  IME_PAY: {
    value: "IME_PAY",
    label: "IME Pay",
    tagline: "Send the total from IME Pay and enter the transaction id.",
    badge: "IME Pay",
    manual: true,
    requiresReference: true,
    referenceLabel: "IME Pay transaction id",
    referenceHint: "The id shown in your IME Pay receipt",
    instructions: [
      "Send the order total to the IME Pay merchant number 9810000000 (Demo Store).",
      "Use your order number as the remark so we can match the payment.",
      "We verify IME Pay transfers on business days, usually within a few hours.",
    ],
  },
  BANK_TRANSFER: {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    tagline: "Transfer the total to our bank account and enter the reference.",
    badge: "Bank",
    manual: true,
    requiresReference: true,
    referenceLabel: "Bank reference / deposit slip number",
    referenceHint: "The reference printed on your transfer receipt",
    instructions: [
      "Account name: Demo Store Pvt. Ltd.",
      "Account number: 0123456789012 - Demo Bank, Kathmandu branch.",
      "Quote your order number in the transfer remark; clearing can take 1-2 business days.",
    ],
  },
  STRIPE: {
    value: "STRIPE",
    label: "Card payment",
    tagline: "Pay now by card through Stripe's secure checkout.",
    badge: "Card",
    manual: false,
    requiresReference: false,
    referenceLabel: null,
    referenceHint: null,
    instructions: [
      "You will be redirected to Stripe to complete the payment.",
      "Your order is confirmed automatically as soon as the payment succeeds.",
    ],
  },
};

export function getPaymentMethod(value: PaymentMethod): PaymentMethodConfig {
  return CONFIGS[value];
}

export function paymentMethodLabel(value: PaymentMethod): string {
  return CONFIGS[value].label;
}

/** True for every method a human confirms (everything except Stripe). */
export function isManualPaymentMethod(value: PaymentMethod): boolean {
  return CONFIGS[value].manual;
}

export function requiresPaymentReference(value: PaymentMethod): boolean {
  return CONFIGS[value].requiresReference;
}

export type PaymentMethodAvailability = {
  /** `isStripeConfigured` from `lib/stripe.ts`. Card payment is hidden when false. */
  stripeConfigured: boolean;
};

/** Methods a customer may choose right now, in display order. */
export function listPaymentMethods({
  stripeConfigured,
}: PaymentMethodAvailability): PaymentMethodConfig[] {
  return PAYMENT_METHOD_VALUES.map((value) => CONFIGS[value]).filter(
    (config) => config.value !== "STRIPE" || stripeConfigured,
  );
}

export function isPaymentMethodAvailable(
  value: PaymentMethod,
  availability: PaymentMethodAvailability,
): boolean {
  return value !== "STRIPE" || availability.stripeConfigured;
}

/** Pre-selected method on the checkout page. Always an available one. */
export function defaultPaymentMethod(availability: PaymentMethodAvailability): PaymentMethod {
  const [first] = listPaymentMethods(availability);
  return first?.value ?? "CASH_ON_DELIVERY";
}
