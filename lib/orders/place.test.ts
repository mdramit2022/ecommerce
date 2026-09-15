import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { CheckoutInput } from "@/lib/validations/checkout";

/**
 * Integration test for placing orders with a manual payment method. Runs against the database in
 * DATABASE_URL (skipped when the variable is absent, e.g. in a unit-only CI job).
 *
 *   set -a; source .env; set +a; npx vitest run lib/orders/place.test.ts
 *
 * Everything it creates is namespaced with a random suffix and removed in afterAll.
 */

type Place = typeof import("@/lib/orders/place");
type AdminOrders = typeof import("@/lib/admin/orders");

const hasDatabase = Boolean(process.env.DATABASE_URL);
const suffix = Math.random().toString(36).slice(2, 8);

const SHIPPING: CheckoutInput["shipping"] = {
  fullName: "Test Buyer",
  line1: "12 Durbar Marg",
  line2: undefined,
  city: "Kathmandu",
  state: undefined,
  postalCode: "44600",
  country: "NP",
  phone: "+977 9800000000",
};

describe.skipIf(!hasDatabase)("lib/orders/place (integration)", () => {
  let prisma: PrismaClient;
  let place: Place;
  let adminOrders: AdminOrders;

  let categoryId: string;
  let userId: string;
  let cartId: string;
  let productAId: string; // stock 10
  let productBId: string; // stock 1
  const orderIds: string[] = [];

  /** Build the draft the route handler would build, pricing the cart from the database. */
  async function draftFor(
    items: { productId: string; quantity: number }[],
    overrides: Partial<CheckoutInput> = {},
    ownerId: string | null = null,
  ) {
    const priced = await place.priceCart(items);
    if (!priced.ok) throw new Error(`priceCart failed: ${priced.code}`);

    const input: CheckoutInput = {
      items,
      email: `buyer-${suffix}@example.com`,
      paymentMethod: "CASH_ON_DELIVERY",
      paymentReference: undefined,
      shipping: SHIPPING,
      saveAddress: false,
      ...overrides,
    };
    return place.toOrderDraft(input, priced.cart, ownerId);
  }

  async function stockOf(productId: string): Promise<number> {
    const row = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });
    return row.stock;
  }

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    place = await import("@/lib/orders/place");
    adminOrders = await import("@/lib/admin/orders");

    const category = await prisma.category.create({
      data: { name: `Place Category ${suffix}`, slug: `place-category-${suffix}` },
      select: { id: true },
    });
    categoryId = category.id;

    const [a, b] = await Promise.all([
      prisma.product.create({
        data: {
          title: `Place Product A ${suffix}`,
          slug: `place-product-a-${suffix}`,
          description: "A",
          price: "10.00",
          stock: 10,
          categoryId,
        },
        select: { id: true },
      }),
      prisma.product.create({
        data: {
          title: `Place Product B ${suffix}`,
          slug: `place-product-b-${suffix}`,
          description: "B",
          price: "2.50",
          stock: 1,
          categoryId,
        },
        select: { id: true },
      }),
    ]);
    productAId = a.id;
    productBId = b.id;

    const user = await prisma.user.create({
      data: { email: `place-user-${suffix}@example.com`, name: "Place User" },
      select: { id: true },
    });
    userId = user.id;

    const cart = await prisma.cart.create({
      data: { userId, items: { create: [{ productId: productAId, quantity: 2 }] } },
      select: { id: true },
    });
    cartId = cart.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    if (cartId) await prisma.cart.deleteMany({ where: { id: cartId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.product.deleteMany({ where: { id: { in: [productAId, productBId] } } });
    if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  describe("priceCart", () => {
    it("prices from the database and ignores anything the client claims", async () => {
      const result = await place.priceCart([{ productId: productAId, quantity: 3 }]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.cart.lines[0]?.unitPrice.toString()).toBe("10");
      expect(result.cart.subtotal.toNumber()).toBe(30);
      expect(result.cart.total.toNumber()).toBe(30);
    });

    it("reports unknown products", async () => {
      const result = await place.priceCart([{ productId: `missing-${suffix}`, quantity: 1 }]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("unavailable");
    });

    it("reports lines that exceed stock", async () => {
      const result = await place.priceCart([{ productId: productBId, quantity: 5 }]);
      expect(result.ok).toBe(false);
      if (result.ok || result.code !== "insufficient-stock") return;
      expect(result.items[0]).toMatchObject({ productId: productBId, available: 1 });
    });
  });

  describe("placeManualOrder", () => {
    it("reserves stock, snapshots the order and empties the customer's cart", async () => {
      const before = await stockOf(productAId);
      const draft = await draftFor([{ productId: productAId, quantity: 2 }], {}, userId);

      const result = await place.placeManualOrder(draft);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      orderIds.push(result.orderId);

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: result.orderId },
        select: {
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          total: true,
          email: true,
          userId: true,
          shippingCity: true,
          shippingCountry: true,
          shippingPhone: true,
          items: { select: { title: true, unitPrice: true, quantity: true } },
        },
      });

      expect(order.status).toBe("PENDING");
      expect(order.paymentStatus).toBe("UNPAID");
      expect(order.paymentMethod).toBe("CASH_ON_DELIVERY");
      expect(order.total.toNumber()).toBe(20);
      expect(order.userId).toBe(userId);
      expect(order.shippingCity).toBe("Kathmandu");
      expect(order.shippingCountry).toBe("NP");
      expect(order.shippingPhone).toBe("+977 9800000000");
      expect(order.items[0]?.unitPrice.toNumber()).toBe(10);

      // Stock is held for the customer straight away, unlike the Stripe flow.
      expect(await stockOf(productAId)).toBe(before - 2);
      expect(await prisma.cartItem.count({ where: { cartId } })).toBe(0);
    });

    it("stores the transaction reference of a wallet transfer", async () => {
      const draft = await draftFor([{ productId: productAId, quantity: 1 }], {
        paymentMethod: "ESEWA",
        paymentReference: "0AB1CD2",
      });

      const result = await place.placeManualOrder(draft);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      orderIds.push(result.orderId);

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: result.orderId },
        select: { paymentMethod: true, paymentReference: true, userId: true },
      });
      expect(order.paymentMethod).toBe("ESEWA");
      expect(order.paymentReference).toBe("0AB1CD2");
      // Guest checkout: no account attached, but the email was captured on the order.
      expect(order.userId).toBeNull();
    });

    it("rolls the whole order back when one line is short of stock", async () => {
      const draft = await draftFor([
        { productId: productAId, quantity: 1 },
        { productId: productBId, quantity: 1 },
      ]);
      // Someone else buys the last unit of B between pricing and placement.
      await prisma.product.update({ where: { id: productBId }, data: { stock: 0 } });

      const stockABefore = await stockOf(productAId);
      const orderCountBefore = await prisma.order.count();

      const result = await place.placeManualOrder(draft);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.items[0]).toMatchObject({ productId: productBId, available: 0 });
      // Nothing was written: no order row, and the first line's stock is untouched.
      expect(await prisma.order.count()).toBe(orderCountBefore);
      expect(await stockOf(productAId)).toBe(stockABefore);

      await prisma.product.update({ where: { id: productBId }, data: { stock: 1 } });
    });

    it("refuses to place a card order (Stripe owns that path)", async () => {
      const draft = await draftFor([{ productId: productAId, quantity: 1 }], {
        paymentMethod: "STRIPE",
      });
      await expect(place.placeManualOrder(draft)).rejects.toThrow(/STRIPE/);
    });
  });

  describe("cancelling a manual order", () => {
    it("returns the reserved stock to inventory", async () => {
      const before = await stockOf(productAId);
      const draft = await draftFor([{ productId: productAId, quantity: 3 }]);

      const placed = await place.placeManualOrder(draft);
      expect(placed.ok).toBe(true);
      if (!placed.ok) return;
      orderIds.push(placed.orderId);
      expect(await stockOf(productAId)).toBe(before - 3);

      const cancelled = await adminOrders.transitionOrderStatus(placed.orderId, {
        status: "CANCELLED",
        markRefunded: false,
      });

      expect(cancelled.ok).toBe(true);
      if (!cancelled.ok) return;
      expect(cancelled.order.status).toBe("CANCELLED");
      expect(cancelled.message).toContain("stock");
      expect(await stockOf(productAId)).toBe(before);
    });

    it("is not touched by the Stripe cancel path", async () => {
      const draft = await draftFor([{ productId: productAId, quantity: 1 }]);
      const placed = await place.placeManualOrder(draft);
      expect(placed.ok).toBe(true);
      if (!placed.ok) return;
      orderIds.push(placed.orderId);

      const fulfill = await import("@/lib/orders/fulfill");
      // cancelPendingOrder only ever applies to Stripe orders; a COD order must survive it.
      expect((await fulfill.cancelPendingOrder(placed.orderId)).cancelled).toBe(false);

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: placed.orderId },
        select: { status: true },
      });
      expect(order.status).toBe("PENDING");
    });
  });

  describe("recording the payment", () => {
    it("confirms a pending order when the money arrives", async () => {
      const draft = await draftFor([{ productId: productAId, quantity: 1 }], {
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "DEP-1",
      });
      const placed = await place.placeManualOrder(draft);
      expect(placed.ok).toBe(true);
      if (!placed.ok) return;
      orderIds.push(placed.orderId);

      const result = await adminOrders.updateOrderPaymentStatus(placed.orderId, {
        paymentStatus: "PAID",
        paymentReference: "DEP-1-VERIFIED",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.order.paymentStatus).toBe("PAID");
      expect(result.order.status).toBe("PAID");
      expect(result.order.paymentReference).toBe("DEP-1-VERIFIED");
    });

    it("keeps the status of a cash-on-delivery order that already shipped", async () => {
      const draft = await draftFor([{ productId: productAId, quantity: 1 }]);
      const placed = await place.placeManualOrder(draft);
      expect(placed.ok).toBe(true);
      if (!placed.ok) return;
      orderIds.push(placed.orderId);

      // Cash on delivery may ship before it is paid.
      const shipped = await adminOrders.transitionOrderStatus(placed.orderId, {
        status: "SHIPPED",
        markRefunded: false,
      });
      expect(shipped.ok).toBe(true);

      const paid = await adminOrders.updateOrderPaymentStatus(placed.orderId, {
        paymentStatus: "PAID",
      });
      expect(paid.ok).toBe(true);
      if (!paid.ok) return;
      expect(paid.order.paymentStatus).toBe("PAID");
      expect(paid.order.status).toBe("SHIPPED");
    });
  });
});
