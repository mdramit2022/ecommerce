import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { PAYMENT_METHOD_VALUES } from "@/lib/payments/methods";
import {
  checkoutCancelQuerySchema,
  checkoutSchema,
  checkoutShippingSchema,
  checkoutSuccessQuerySchema,
  paymentMethodSchema,
} from "./checkout";

/** Distinct `path` strings of failed issues, e.g. ["items", "items.0.quantity"]. */
function failedPaths(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  return [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
}

const SHIPPING = {
  fullName: "Demo Customer",
  line1: "12 Durbar Marg",
  city: "Kathmandu",
  postalCode: "44600",
  country: "NP",
  phone: "+977 9800000000",
};

const BODY = {
  items: [{ productId: "prod_a", quantity: 2 }],
  email: "buyer@example.com",
  paymentMethod: "CASH_ON_DELIVERY",
  shipping: SHIPPING,
};

const LONG_SESSION_ID = `cs_${"a".repeat(260)}`;

describe("paymentMethodSchema", () => {
  it.each(PAYMENT_METHOD_VALUES)("accepts %s", (method) => {
    expect(paymentMethodSchema.parse(method)).toBe(method);
  });

  it.each(["", "paypal", "cash", "stripe", null, 1])("rejects %j", (method) => {
    expect(paymentMethodSchema.safeParse(method).success).toBe(false);
  });
});

describe("checkoutShippingSchema", () => {
  it("trims text and upper-cases the country code", () => {
    const result = checkoutShippingSchema.parse({
      ...SHIPPING,
      fullName: "  Demo Customer  ",
      country: "np",
    });
    expect(result.fullName).toBe("Demo Customer");
    expect(result.country).toBe("NP");
  });

  it("treats blank optional fields as absent", () => {
    const result = checkoutShippingSchema.parse({ ...SHIPPING, line2: "   ", state: "" });
    expect(result.line2).toBeUndefined();
    expect(result.state).toBeUndefined();
  });

  it.each(["fullName", "line1", "city", "postalCode", "country", "phone"] as const)(
    "requires %s",
    (field) => {
      const body: Record<string, unknown> = { ...SHIPPING };
      delete body[field];
      expect(failedPaths(checkoutShippingSchema.safeParse(body))).toEqual([field]);
    },
  );

  it.each(["NPL", "n", "12", ""])("rejects country=%j", (country) => {
    expect(failedPaths(checkoutShippingSchema.safeParse({ ...SHIPPING, country }))).toEqual([
      "country",
    ]);
  });

  it.each(["123", "not a phone", ""])("rejects phone=%j", (phone) => {
    expect(failedPaths(checkoutShippingSchema.safeParse({ ...SHIPPING, phone }))).toEqual([
      "phone",
    ]);
  });
});

describe("checkoutSchema", () => {
  it("accepts a cash-on-delivery order", () => {
    const result = checkoutSchema.parse(BODY);
    expect(result.items).toEqual([{ productId: "prod_a", quantity: 2 }]);
    expect(result.paymentMethod).toBe("CASH_ON_DELIVERY");
    expect(result.saveAddress).toBe(false);
    expect(result.shipping.country).toBe("NP");
  });

  it("normalises the contact email", () => {
    expect(checkoutSchema.parse({ ...BODY, email: "  Buyer@Example.COM " }).email).toBe(
      "buyer@example.com",
    );
  });

  it("only trusts productId and quantity (client prices are stripped)", () => {
    const result = checkoutSchema.parse({
      ...BODY,
      items: [{ productId: "prod_a", quantity: 1, price: 0.01, title: "hacked" }],
      total: 0,
    });

    expect(result.items).toEqual([{ productId: "prod_a", quantity: 1 }]);
    expect(result.items[0]).not.toHaveProperty("price");
    expect(result).not.toHaveProperty("total");
  });

  it("rejects an empty cart with a friendly message", () => {
    const result = checkoutSchema.safeParse({ ...BODY, items: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Cart is empty");
      expect(result.error.issues[0]?.path).toEqual(["items"]);
    }
  });

  it("caps the cart at 50 lines", () => {
    const line = { productId: "prod_a", quantity: 1 };
    const fifty = Array.from({ length: 50 }, () => line);
    const fiftyOne = Array.from({ length: 51 }, () => line);

    expect(checkoutSchema.safeParse({ ...BODY, items: fifty }).success).toBe(true);
    expect(failedPaths(checkoutSchema.safeParse({ ...BODY, items: fiftyOne }))).toEqual(["items"]);
  });

  it.each(["items", "email", "paymentMethod", "shipping"] as const)("requires %s", (field) => {
    const body: Record<string, unknown> = { ...BODY };
    delete body[field];
    expect(failedPaths(checkoutSchema.safeParse(body))).toContain(field);
  });

  it("reports invalid shipping fields with a nested path", () => {
    const result = checkoutSchema.safeParse({
      ...BODY,
      shipping: { ...SHIPPING, postalCode: "" },
    });
    expect(failedPaths(result)).toEqual(["shipping.postalCode"]);
  });

  describe("quantity", () => {
    it("accepts the boundaries 1 and 99", () => {
      for (const quantity of [1, 99]) {
        expect(
          checkoutSchema.safeParse({ ...BODY, items: [{ productId: "p", quantity }] }).success,
        ).toBe(true);
      }
    });

    it.each([0, -1, 100, 1.5, "2", null, undefined])("rejects %j", (quantity) => {
      const result = checkoutSchema.safeParse({ ...BODY, items: [{ productId: "p", quantity }] });
      expect(failedPaths(result)).toEqual(["items.0.quantity"]);
    });
  });

  describe("productId", () => {
    it.each(["", 123, null, undefined])("rejects %j", (productId) => {
      const result = checkoutSchema.safeParse({ ...BODY, items: [{ productId, quantity: 1 }] });
      expect(failedPaths(result)).toEqual(["items.0.productId"]);
    });
  });

  describe("paymentReference", () => {
    it.each(["ESEWA", "IME_PAY", "BANK_TRANSFER"] as const)("is required for %s", (method) => {
      const result = checkoutSchema.safeParse({ ...BODY, paymentMethod: method });
      expect(failedPaths(result)).toEqual(["paymentReference"]);

      const withReference = checkoutSchema.safeParse({
        ...BODY,
        paymentMethod: method,
        paymentReference: "TXN-0001",
      });
      expect(withReference.success).toBe(true);
    });

    it.each(["CASH_ON_DELIVERY", "STRIPE"] as const)("is refused for %s", (method) => {
      const result = checkoutSchema.safeParse({
        ...BODY,
        paymentMethod: method,
        paymentReference: "TXN-0001",
      });
      expect(failedPaths(result)).toEqual(["paymentReference"]);
    });

    it("ignores a blank reference", () => {
      const result = checkoutSchema.parse({ ...BODY, paymentReference: "   " });
      expect(result.paymentReference).toBeUndefined();
    });

    it("caps the reference at 100 characters", () => {
      const result = checkoutSchema.safeParse({
        ...BODY,
        paymentMethod: "ESEWA",
        paymentReference: "x".repeat(101),
      });
      expect(failedPaths(result)).toEqual(["paymentReference"]);
    });
  });

  it.each([{}, { items: null }, [], null, "items"])("rejects a malformed body: %j", (body) => {
    expect(checkoutSchema.safeParse(body).success).toBe(false);
  });
});

describe("checkoutSuccessQuerySchema", () => {
  it.each(["cs_test_a1B2c3", "cs_live_ABC_123", "cs_x"])("accepts session_id=%s", (session_id) => {
    expect(checkoutSuccessQuerySchema.parse({ session_id })).toEqual({ session_id });
  });

  it("accepts an order_id for manually paid orders", () => {
    expect(checkoutSuccessQuerySchema.parse({ order_id: "clx0f3k2a0000abcd1234efgh" })).toEqual({
      order_id: "clx0f3k2a0000abcd1234efgh",
    });
  });

  it.each([
    "cs_",
    "pi_test_123", // wrong Stripe object prefix
    "cs_test_123; DROP TABLE", // unsafe characters
    "cs_test-dash",
    LONG_SESSION_ID,
  ])("rejects session_id=%j", (session_id) => {
    const result = checkoutSuccessQuerySchema.safeParse({ session_id });
    expect(result.success).toBe(false);
    expect(failedPaths(result)).toEqual(["session_id"]);
  });

  it.each(["order 1", "order/1", "a".repeat(65)])("rejects order_id=%j", (order_id) => {
    expect(failedPaths(checkoutSuccessQuerySchema.safeParse({ order_id }))).toEqual(["order_id"]);
  });

  it("requires at least one identifier", () => {
    expect(failedPaths(checkoutSuccessQuerySchema.safeParse({}))).toEqual(["session_id"]);
    expect(
      failedPaths(checkoutSuccessQuerySchema.safeParse({ session_id: undefined, order_id: "" })),
    ).toContain("order_id");
  });
});

describe("checkoutCancelQuerySchema", () => {
  it("accepts a cuid-like order_id", () => {
    expect(checkoutCancelQuerySchema.parse({ order_id: "clx0f3k2a0000abcd1234efgh" })).toEqual({
      order_id: "clx0f3k2a0000abcd1234efgh",
    });
  });

  it("treats order_id as optional", () => {
    expect(checkoutCancelQuerySchema.parse({})).toEqual({});
  });

  it.each(["", "order 1", "order/1", "a".repeat(65)])("rejects order_id=%j", (order_id) => {
    expect(failedPaths(checkoutCancelQuerySchema.safeParse({ order_id }))).toEqual(["order_id"]);
  });
});
