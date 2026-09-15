import { describe, expect, it } from "vitest";
import {
  orderDetailSelect,
  orderItemSelect,
  orderSummarySelect,
  toOrderDetail,
  toOrderItemData,
  toOrderSummary,
} from "./serialize";
import {
  FIXED_DATE,
  FULL_SHIPPING,
  LATER_DATE,
  decimal,
  makeOrderDetailRow,
  makeOrderItemRow,
  makeOrderSummaryRow,
} from "@/tests/helpers/rows";

describe("selects", () => {
  it("reuses orderItemSelect for the detail items relation", () => {
    expect(orderDetailSelect.items.select).toBe(orderItemSelect);
  });

  it("selects the payment method on both selects so every surface can show it", () => {
    expect(orderSummarySelect.paymentMethod).toBe(true);
    expect(orderDetailSelect).toMatchObject({ paymentMethod: true, paymentReference: true });
  });

  it("selects the item count for summaries instead of loading items", () => {
    expect(orderSummarySelect._count).toEqual({ select: { items: true } });
    expect(orderSummarySelect).not.toHaveProperty("items");
  });

  it("selects every shipping snapshot column for details", () => {
    expect(orderDetailSelect).toMatchObject({
      shippingName: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingCountry: true,
      shippingPhone: true,
    });
  });
});

describe("toOrderItemData", () => {
  it("converts unitPrice to a number and computes the line total", () => {
    const result = toOrderItemData(makeOrderItemRow({ unitPrice: decimal("19.99"), quantity: 2 }));

    expect(result.unitPrice).toBe(19.99);
    expect(result.lineTotal).toBe(39.98);
  });

  it.each([
    ["0.10", 3, 0.3],
    ["1.10", 3, 3.3],
    ["4.35", 1, 4.35],
    ["19.99", 3, 59.97],
    ["0.01", 99, 0.99],
    ["1234.56", 7, 8641.92],
    ["24.00", 1, 24],
  ])("rounds lineTotal to 2dp: %s x %s = %s", (unitPrice, quantity, expected) => {
    const result = toOrderItemData(makeOrderItemRow({ unitPrice: decimal(unitPrice), quantity }));
    expect(result.lineTotal).toBe(expected);
    // No floating-point tail such as 0.30000000000000004.
    expect(Number(result.lineTotal.toFixed(2))).toBe(result.lineTotal);
  });

  it("exposes the product slug for linking back to the catalog", () => {
    expect(
      toOrderItemData(makeOrderItemRow({ product: { slug: "merino-crew-sweater" } })).productSlug,
    ).toBe("merino-crew-sweater");
  });

  it("keeps a null image snapshot", () => {
    expect(toOrderItemData(makeOrderItemRow({ image: null })).image).toBeNull();
  });

  it("produces exactly the OrderItemData keys", () => {
    expect(Object.keys(toOrderItemData(makeOrderItemRow())).sort()).toEqual(
      [
        "id",
        "image",
        "lineTotal",
        "productId",
        "productSlug",
        "quantity",
        "title",
        "unitPrice",
      ].sort(),
    );
  });
});

describe("toOrderSummary", () => {
  it("serialises money, count and timestamp", () => {
    const result = toOrderSummary(
      makeOrderSummaryRow({
        total: decimal("123.45"),
        _count: { items: 3 },
        createdAt: FIXED_DATE,
      }),
    );

    expect(result.total).toBe(123.45);
    expect(result.itemCount).toBe(3);
    expect(result.createdAt).toBe("2026-09-10T12:34:56.789Z");
  });

  it("passes identity and status fields through", () => {
    const result = toOrderSummary(
      makeOrderSummaryRow({
        id: "order_9",
        orderNumber: "ORD-20260101-ABCDEF",
        status: "SHIPPED",
        paymentStatus: "REFUNDED",
        paymentMethod: "ESEWA",
        currency: "eur",
      }),
    );

    expect(result).toMatchObject({
      id: "order_9",
      orderNumber: "ORD-20260101-ABCDEF",
      status: "SHIPPED",
      paymentStatus: "REFUNDED",
      paymentMethod: "ESEWA",
      currency: "eur",
    });
  });

  it("produces exactly the OrderSummary keys", () => {
    expect(Object.keys(toOrderSummary(makeOrderSummaryRow())).sort()).toEqual(
      [
        "createdAt",
        "currency",
        "id",
        "itemCount",
        "orderNumber",
        "paymentMethod",
        "paymentStatus",
        "status",
        "total",
      ].sort(),
    );
  });

  it("is JSON-serialisable", () => {
    const result = toOrderSummary(makeOrderSummaryRow());
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe("toOrderDetail", () => {
  it("converts every money column to a number", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({
        subtotal: decimal("39.98"),
        shippingCost: decimal("5.00"),
        tax: decimal("3.60"),
        total: decimal("48.58"),
      }),
    );

    expect(result.subtotal).toBe(39.98);
    expect(result.shippingCost).toBe(5);
    expect(result.tax).toBe(3.6);
    expect(result.total).toBe(48.58);
  });

  it("serialises both timestamps as ISO strings", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({ createdAt: FIXED_DATE, updatedAt: LATER_DATE }),
    );

    expect(result.createdAt).toBe("2026-09-10T12:34:56.789Z");
    expect(result.updatedAt).toBe("2026-09-11T08:00:00.000Z");
  });

  it("returns a null shippingAddress when no address has been captured yet", () => {
    expect(toOrderDetail(makeOrderDetailRow()).shippingAddress).toBeNull();
  });

  it("builds the full shipping address snapshot", () => {
    expect(toOrderDetail(makeOrderDetailRow(FULL_SHIPPING)).shippingAddress).toEqual({
      name: "Demo Customer",
      line1: "1 Market St",
      line2: "Suite 200",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
      phone: "+1 415 555 0100",
    });
  });

  it.each(["shippingLine1", "shippingCity", "shippingCountry"] as const)(
    "treats %s on its own as an address (other fields stay null)",
    (column) => {
      const result = toOrderDetail(makeOrderDetailRow({ [column]: "value" }));

      expect(result.shippingAddress).not.toBeNull();
      const populated = Object.values(result.shippingAddress ?? {}).filter((v) => v !== null);
      expect(populated).toEqual(["value"]);
    },
  );

  it("does not treat a name or phone alone as a physical address", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({ shippingName: "Demo Customer", shippingPhone: "+1 415 555 0100" }),
    );
    expect(result.shippingAddress).toBeNull();
  });

  it("serialises items via toOrderItemData and derives itemCount from the items", () => {
    const items = [
      makeOrderItemRow({ id: "item_a", unitPrice: decimal("19.99"), quantity: 2 }),
      makeOrderItemRow({ id: "item_b", unitPrice: decimal("0.10"), quantity: 3, image: null }),
    ];
    const result = toOrderDetail(makeOrderDetailRow({ items }));

    expect(result.itemCount).toBe(2);
    expect(result.items).toEqual(items.map(toOrderItemData));
    expect(result.items.map((i) => i.lineTotal)).toEqual([39.98, 0.3]);
  });

  it("handles an order with no items", () => {
    const result = toOrderDetail(makeOrderDetailRow({ items: [] }));
    expect(result.items).toEqual([]);
    expect(result.itemCount).toBe(0);
  });

  it("maps the user relation to customer", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({ user: { id: "user_7", name: null, email: "someone@example.com" } }),
    );
    expect(result.customer).toEqual({ id: "user_7", name: null, email: "someone@example.com" });
  });

  it("returns a null customer for guest orders but keeps the checkout email", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({ user: null, userId: null, email: "guest@example.com" }),
    );

    expect(result.customer).toBeNull();
    expect(result.userId).toBeNull();
    expect(result.email).toBe("guest@example.com");
  });

  it("carries the payment method and manual transfer reference", () => {
    const result = toOrderDetail(
      makeOrderDetailRow({
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "DEP-99812",
        stripeSessionId: null,
        stripePaymentIntentId: null,
      }),
    );

    expect(result.paymentMethod).toBe("BANK_TRANSFER");
    expect(result.paymentReference).toBe("DEP-99812");
  });

  it("keeps a null reference for orders with nothing to verify", () => {
    const result = toOrderDetail(makeOrderDetailRow({ paymentMethod: "CASH_ON_DELIVERY" }));
    expect(result.paymentMethod).toBe("CASH_ON_DELIVERY");
    expect(result.paymentReference).toBeNull();
  });

  it("passes Stripe references through, including nulls", () => {
    expect(toOrderDetail(makeOrderDetailRow())).toMatchObject({
      stripeSessionId: "cs_test_123",
      stripePaymentIntentId: "pi_test_123",
    });
    expect(
      toOrderDetail(makeOrderDetailRow({ stripeSessionId: null, stripePaymentIntentId: null })),
    ).toMatchObject({ stripeSessionId: null, stripePaymentIntentId: null });
  });

  it("is a superset of the summary shape", () => {
    const detail = toOrderDetail(makeOrderDetailRow());
    const summaryKeys = Object.keys(toOrderSummary(makeOrderSummaryRow()));
    for (const key of summaryKeys) {
      expect(detail).toHaveProperty(key);
    }
  });

  it("is JSON-serialisable", () => {
    const result = toOrderDetail(makeOrderDetailRow(FULL_SHIPPING));
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
