import type { PaymentMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  PAYMENT_METHOD_VALUES,
  defaultPaymentMethod,
  getPaymentMethod,
  isManualPaymentMethod,
  isPaymentMethodAvailable,
  listPaymentMethods,
  paymentMethodLabel,
  requiresPaymentReference,
} from "./methods";

const ALL: readonly PaymentMethod[] = [
  "STRIPE",
  "CASH_ON_DELIVERY",
  "BANK_TRANSFER",
  "ESEWA",
  "IME_PAY",
];

describe("PAYMENT_METHOD_VALUES", () => {
  it("lists every Prisma PaymentMethod exactly once", () => {
    expect([...PAYMENT_METHOD_VALUES].sort()).toEqual([...ALL].sort());
    expect(new Set(PAYMENT_METHOD_VALUES).size).toBe(PAYMENT_METHOD_VALUES.length);
  });

  it("offers cash on delivery first and card payment last", () => {
    expect(PAYMENT_METHOD_VALUES[0]).toBe("CASH_ON_DELIVERY");
    expect(PAYMENT_METHOD_VALUES.at(-1)).toBe("STRIPE");
  });
});

describe("getPaymentMethod", () => {
  it.each(ALL)("returns a complete, self-consistent config for %s", (value) => {
    const config = getPaymentMethod(value);

    expect(config.value).toBe(value);
    expect(config.label.length).toBeGreaterThan(0);
    expect(config.tagline.length).toBeGreaterThan(0);
    expect(config.badge.length).toBeGreaterThan(0);
    expect(config.instructions.length).toBeGreaterThan(0);
    // A reference can only be demanded when the customer is told what to type.
    expect(Boolean(config.referenceLabel)).toBe(config.requiresReference);
  });

  it("uses unique labels so the checkout menu is unambiguous", () => {
    const labels = ALL.map(paymentMethodLabel);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("isManualPaymentMethod", () => {
  it("treats every method except Stripe as manually confirmed", () => {
    expect(isManualPaymentMethod("STRIPE")).toBe(false);
    for (const value of ALL.filter((v) => v !== "STRIPE")) {
      expect(isManualPaymentMethod(value)).toBe(true);
    }
  });
});

describe("requiresPaymentReference", () => {
  it("asks for a transaction id only for wallet and bank transfers", () => {
    expect(requiresPaymentReference("ESEWA")).toBe(true);
    expect(requiresPaymentReference("IME_PAY")).toBe(true);
    expect(requiresPaymentReference("BANK_TRANSFER")).toBe(true);
    expect(requiresPaymentReference("CASH_ON_DELIVERY")).toBe(false);
    expect(requiresPaymentReference("STRIPE")).toBe(false);
  });
});

describe("listPaymentMethods", () => {
  it("includes card payment when Stripe is configured", () => {
    const values = listPaymentMethods({ stripeConfigured: true }).map((m) => m.value);
    expect(values).toEqual([...PAYMENT_METHOD_VALUES]);
  });

  it("hides card payment when Stripe keys are placeholders", () => {
    const values = listPaymentMethods({ stripeConfigured: false }).map((m) => m.value);
    expect(values).not.toContain("STRIPE");
    expect(values).toEqual(PAYMENT_METHOD_VALUES.filter((v) => v !== "STRIPE"));
  });

  it("always leaves at least one way to pay", () => {
    expect(listPaymentMethods({ stripeConfigured: false }).length).toBeGreaterThan(0);
  });
});

describe("isPaymentMethodAvailable", () => {
  it("gates only Stripe behind configuration", () => {
    for (const value of ALL) {
      expect(isPaymentMethodAvailable(value, { stripeConfigured: true })).toBe(true);
      expect(isPaymentMethodAvailable(value, { stripeConfigured: false })).toBe(value !== "STRIPE");
    }
  });
});

describe("defaultPaymentMethod", () => {
  it.each([true, false])("pre-selects an available method (stripeConfigured=%s)", (configured) => {
    const selected = defaultPaymentMethod({ stripeConfigured: configured });
    expect(selected).toBe("CASH_ON_DELIVERY");
    expect(isPaymentMethodAvailable(selected, { stripeConfigured: configured })).toBe(true);
  });
});
