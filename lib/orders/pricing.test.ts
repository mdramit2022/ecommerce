import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildPricedCart,
  cartTotals,
  mergeQuantities,
  missingProductIds,
  priceLines,
  stockIssues,
  subtotalOf,
  type ProductPriceRow,
} from "./pricing";

const decimal = (value: string) => new Prisma.Decimal(value);

function product(overrides: Partial<ProductPriceRow> = {}): ProductPriceRow {
  return {
    id: "prod_tee",
    title: "Classic Cotton Tee",
    price: decimal("24.00"),
    stock: 10,
    images: ["https://images.example.com/tee.jpg"],
    ...overrides,
  };
}

describe("mergeQuantities", () => {
  it("sums duplicate lines for the same product", () => {
    const merged = mergeQuantities([
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 },
      { productId: "a", quantity: 3 },
    ]);

    expect(merged.get("a")).toBe(5);
    expect(merged.get("b")).toBe(1);
    expect(merged.size).toBe(2);
  });

  it("keeps the order of first appearance", () => {
    const merged = mergeQuantities([
      { productId: "b", quantity: 1 },
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 1 },
    ]);
    expect([...merged.keys()]).toEqual(["b", "a"]);
  });

  it("returns an empty map for an empty cart", () => {
    expect(mergeQuantities([]).size).toBe(0);
  });
});

describe("missingProductIds", () => {
  it("reports ids the database did not return", () => {
    expect(missingProductIds(["a", "b", "c"], [{ id: "a" }, { id: "c" }])).toEqual(["b"]);
  });

  it("returns an empty list when everything was found", () => {
    expect(missingProductIds(["a"], [{ id: "a" }])).toEqual([]);
  });

  it("treats an empty product list as everything missing", () => {
    expect(missingProductIds(["a", "b"], [])).toEqual(["a", "b"]);
  });
});

describe("stockIssues", () => {
  it("reports only the lines that exceed available stock", () => {
    const products = [
      product({ id: "a", title: "A", stock: 2 }),
      product({ id: "b", title: "B", stock: 5 }),
    ];
    const quantities = new Map([
      ["a", 3],
      ["b", 5],
    ]);

    expect(stockIssues(products, quantities)).toEqual([
      { productId: "a", title: "A", available: 2 },
    ]);
  });

  it("allows buying exactly the remaining stock", () => {
    expect(stockIssues([product({ stock: 3 })], new Map([["prod_tee", 3]]))).toEqual([]);
  });

  it("reports a sold-out product as available: 0", () => {
    expect(stockIssues([product({ stock: 0 })], new Map([["prod_tee", 1]]))).toEqual([
      { productId: "prod_tee", title: "Classic Cotton Tee", available: 0 },
    ]);
  });
});

describe("priceLines", () => {
  it("uses database prices and the first image, in requested order", () => {
    const products = [
      product({ id: "b", title: "B", price: decimal("10.00") }),
      product({ id: "a", title: "A", price: decimal("5.50") }),
    ];
    const quantities = new Map([
      ["a", 2],
      ["b", 1],
    ]);

    const lines = priceLines(["a", "b"], products, quantities);

    expect(lines.map((line) => line.productId)).toEqual(["a", "b"]);
    expect(lines[0]?.unitPrice.toString()).toBe("5.5");
    expect(lines[0]?.quantity).toBe(2);
    expect(lines[0]?.image).toBe("https://images.example.com/tee.jpg");
  });

  it("stores a null image when the product has none", () => {
    const lines = priceLines(["prod_tee"], [product({ images: [] })], new Map([["prod_tee", 1]]));
    expect(lines[0]?.image).toBeNull();
  });

  it("skips ids with no product row or no quantity", () => {
    const products = [product({ id: "a" })];
    expect(priceLines(["a", "ghost"], products, new Map([["a", 1]]))).toHaveLength(1);
    expect(priceLines(["a"], products, new Map([["a", 0]]))).toEqual([]);
  });
});

describe("subtotalOf", () => {
  it("multiplies and sums exactly (no floating point drift)", () => {
    const lines = priceLines(
      ["a", "b"],
      [product({ id: "a", price: decimal("0.10") }), product({ id: "b", price: decimal("19.99") })],
      new Map([
        ["a", 3],
        ["b", 3],
      ]),
    );

    expect(subtotalOf(lines).toString()).toBe("60.27");
    // 0.1 * 3 in binary floating point is 0.30000000000000004; Decimal must not drift.
    expect(subtotalOf(lines).toNumber()).toBe(60.27);
  });

  it("is zero for an empty cart", () => {
    expect(subtotalOf([]).toString()).toBe("0");
  });
});

describe("cartTotals", () => {
  it("charges no shipping or tax today and totals to the subtotal", () => {
    const lines = priceLines(
      ["a"],
      [product({ id: "a", price: decimal("24.00") })],
      new Map([["a", 2]]),
    );
    const totals = cartTotals(lines);

    expect(totals.subtotal.toNumber()).toBe(48);
    expect(totals.shippingCost.toNumber()).toBe(0);
    expect(totals.tax.toNumber()).toBe(0);
    expect(totals.total.toNumber()).toBe(48);
  });

  it("keeps total = subtotal + shipping + tax", () => {
    const lines = priceLines(
      ["a"],
      [product({ id: "a", price: decimal("7.35") })],
      new Map([["a", 3]]),
    );
    const { subtotal, shippingCost, tax, total } = cartTotals(lines);
    expect(total.toString()).toBe(subtotal.add(shippingCost).add(tax).toString());
  });
});

describe("buildPricedCart", () => {
  it("returns priced lines with their totals", () => {
    const cart = buildPricedCart(
      ["a", "b"],
      [
        product({ id: "a", title: "A", price: decimal("12.50") }),
        product({ id: "b", title: "B", price: decimal("3.25") }),
      ],
      new Map([
        ["a", 2],
        ["b", 4],
      ]),
    );

    expect(cart.lines).toHaveLength(2);
    expect(cart.subtotal.toNumber()).toBe(38);
    expect(cart.total.toNumber()).toBe(38);
  });
});
