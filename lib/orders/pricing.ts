import { Prisma } from "@prisma/client";

/**
 * Pure order arithmetic. No Prisma client, env or network access, so it is unit-testable and
 * usable from any runtime. `lib/orders/place.ts` supplies the database rows.
 *
 * Money stays a `Prisma.Decimal` here; it is converted to a number only by the serializers
 * (display) and to integer minor units at the Stripe boundary.
 */

export type ProductPriceRow = {
  id: string;
  title: string;
  price: Prisma.Decimal;
  stock: number;
  images: string[];
};

export type PricedLine = {
  productId: string;
  title: string;
  image: string | null;
  unitPrice: Prisma.Decimal;
  quantity: number;
};

export type CartTotals = {
  subtotal: Prisma.Decimal;
  shippingCost: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
};

export type PricedCart = CartTotals & { lines: PricedLine[] };

/** Collapse duplicate product ids, summing their quantities. Order of first appearance is kept. */
export function mergeQuantities(
  items: readonly { productId: string; quantity: number }[],
): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return quantities;
}

/** Products the customer asked for that are not in `products` (deleted or deactivated). */
export function missingProductIds(
  requestedIds: readonly string[],
  products: readonly { id: string }[],
): string[] {
  const found = new Set(products.map((product) => product.id));
  return requestedIds.filter((id) => !found.has(id));
}

export type StockIssue = { productId: string; title: string; available: number };

/** Lines whose quantity exceeds the stock on hand. */
export function stockIssues(
  products: readonly ProductPriceRow[],
  quantities: ReadonlyMap<string, number>,
): StockIssue[] {
  return products
    .filter((product) => (quantities.get(product.id) ?? 0) > product.stock)
    .map((product) => ({ productId: product.id, title: product.title, available: product.stock }));
}

/**
 * Build order lines from database prices, in the order the ids were requested so the order
 * reads like the cart the customer saw. Unknown ids are skipped (callers reject them first).
 */
export function priceLines(
  requestedIds: readonly string[],
  products: readonly ProductPriceRow[],
  quantities: ReadonlyMap<string, number>,
): PricedLine[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: PricedLine[] = [];

  for (const id of requestedIds) {
    const product = byId.get(id);
    const quantity = quantities.get(id) ?? 0;
    if (!product || quantity < 1) continue;
    lines.push({
      productId: product.id,
      title: product.title,
      image: product.images[0] ?? null,
      unitPrice: product.price,
      quantity,
    });
  }

  return lines;
}

/** Exact Decimal subtotal of the given lines. */
export function subtotalOf(lines: readonly PricedLine[]): Prisma.Decimal {
  return lines.reduce(
    (sum, line) => sum.add(line.unitPrice.mul(line.quantity)),
    new Prisma.Decimal(0),
  );
}

/**
 * Totals for a set of lines. Shipping and tax are zero today; change them here (and only here)
 * when the store starts charging either.
 */
export function cartTotals(lines: readonly PricedLine[]): CartTotals {
  const subtotal = subtotalOf(lines);
  const shippingCost = new Prisma.Decimal(0);
  const tax = new Prisma.Decimal(0);
  return { subtotal, shippingCost, tax, total: subtotal.add(shippingCost).add(tax) };
}

export function buildPricedCart(
  requestedIds: readonly string[],
  products: readonly ProductPriceRow[],
  quantities: ReadonlyMap<string, number>,
): PricedCart {
  const lines = priceLines(requestedIds, products, quantities);
  return { lines, ...cartTotals(lines) };
}
