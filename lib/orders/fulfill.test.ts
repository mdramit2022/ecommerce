import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import type { PrismaClient } from "@prisma/client";

/**
 * Integration test for the Stripe fulfilment helpers. Runs against the database in
 * DATABASE_URL (skipped when the variable is absent, e.g. in a unit-only CI job).
 *
 *   set -a; source .env; set +a; npx vitest run lib/orders/fulfill.test.ts
 *
 * Everything it creates is namespaced with a random suffix and removed in afterAll.
 */

type Fulfill = typeof import("@/lib/orders/fulfill");
type Emails = typeof import("@/lib/orders/emails");
type Serialize = typeof import("@/lib/orders/serialize");

const hasDatabase = Boolean(process.env.DATABASE_URL);
const suffix = Math.random().toString(36).slice(2, 8);

/** Minimal stand-in for a completed Checkout Session. Only the fields fulfilment reads. */
function fakeSession(overrides: Record<string, unknown>): Stripe.Checkout.Session {
  return {
    id: `cs_test_${suffix}_${Math.random().toString(36).slice(2, 8)}`,
    object: "checkout.session",
    payment_status: "paid",
    // Real sessions each own a distinct PaymentIntent; mirror that unless a test overrides it.
    payment_intent: `pi_test_${suffix}_${Math.random().toString(36).slice(2, 8)}`,
    client_reference_id: null,
    metadata: {},
    customer_email: null,
    customer_details: {
      email: `buyer-${suffix}@example.com`,
      name: "Buyer Example",
      phone: "+15555550123",
      address: null,
      tax_exempt: "none",
      tax_ids: [],
    },
    shipping_details: {
      name: "Ship To Person",
      address: {
        line1: "1 Test Street",
        line2: "Unit 2",
        city: "Testville",
        state: "CA",
        postal_code: "90210",
        country: "US",
      },
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

describe.skipIf(!hasDatabase)("lib/orders/fulfill (integration)", () => {
  let prisma: PrismaClient;
  let fulfill: Fulfill;
  let emails: Emails;
  let serialize: Serialize;

  let categoryId: string;
  let userId: string;
  let cartId: string;
  let productAId: string; // stock 5
  let productBId: string; // stock 1 (insufficient for the order)
  const orderIds: string[] = [];

  async function createPendingOrder(input: {
    withSession: boolean;
    withUser: boolean;
    items: Array<{ productId: string; quantity: number; unitPrice: string; title: string }>;
  }) {
    const subtotal = input.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${suffix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        userId: input.withUser ? userId : null,
        email: input.withUser ? `user-${suffix}@example.com` : "pending@checkout",
        subtotal,
        total: subtotal,
        currency: "usd",
        stripeSessionId: input.withSession ? `cs_test_${suffix}_${orderIds.length}` : null,
        items: {
          createMany: {
            data: input.items.map((i) => ({
              productId: i.productId,
              title: i.title,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          },
        },
      },
      select: { id: true, stripeSessionId: true, orderNumber: true },
    });
    orderIds.push(order.id);
    return order;
  }

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    fulfill = await import("@/lib/orders/fulfill");
    emails = await import("@/lib/orders/emails");
    serialize = await import("@/lib/orders/serialize");

    const category = await prisma.category.create({
      data: { name: `Test Category ${suffix}`, slug: `test-category-${suffix}` },
      select: { id: true },
    });
    categoryId = category.id;

    const [a, b] = await Promise.all([
      prisma.product.create({
        data: {
          title: `Test Product A ${suffix}`,
          slug: `test-product-a-${suffix}`,
          description: "A",
          price: "10.00",
          stock: 5,
          categoryId,
        },
        select: { id: true },
      }),
      prisma.product.create({
        data: {
          title: `Test Product B <script> ${suffix}`,
          slug: `test-product-b-${suffix}`,
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
      data: { email: `user-${suffix}@example.com`, name: "Test User" },
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

  it("fulfils a pending order once, decrements stock safely, empties the cart", async () => {
    const order = await createPendingOrder({
      withSession: true,
      withUser: true,
      items: [
        { productId: productAId, quantity: 2, unitPrice: "10.00", title: "A" },
        { productId: productBId, quantity: 3, unitPrice: "2.50", title: "B" }, // only 1 in stock
      ],
    });
    // Order row has stripeSessionId; the session id must match for lookup.
    const session = fakeSession({
      id: order.stripeSessionId,
      payment_intent: `pi_first_${suffix}`,
    });

    const first = await fulfill.fulfillOrderFromCheckoutSession(session);
    expect(first.outcome).toBe("fulfilled");
    expect(first.alreadyFulfilled).toBe(false);
    if (first.outcome === "fulfilled") {
      expect(first.order.status).toBe("PAID");
      expect(first.order.paymentStatus).toBe("PAID");
      expect(first.order.shippingAddress?.line1).toBe("1 Test Street");
      expect(first.order.shippingAddress?.phone).toBe("+15555550123");
      expect(first.order.stripePaymentIntentId).toBe(`pi_first_${suffix}`);
      expect(first.order.email).toBe(`buyer-${suffix}@example.com`);
      // No RESEND_API_KEY in tests -> email is skipped, never thrown.
      expect(typeof first.emailSent).toBe("boolean");
    }

    const [a, b, cartItems] = await Promise.all([
      prisma.product.findUniqueOrThrow({ where: { id: productAId }, select: { stock: true } }),
      prisma.product.findUniqueOrThrow({ where: { id: productBId }, select: { stock: true } }),
      prisma.cartItem.count({ where: { cartId } }),
    ]);
    expect(a.stock).toBe(3); // 5 - 2
    expect(b.stock).toBe(1); // insufficient -> untouched, never negative
    expect(cartItems).toBe(0);

    // Second delivery of the same event is a no-op.
    const second = await fulfill.fulfillOrderFromCheckoutSession(session);
    expect(second.outcome).toBe("already-fulfilled");
    expect(second.alreadyFulfilled).toBe(true);
    const aAgain = await prisma.product.findUniqueOrThrow({
      where: { id: productAId },
      select: { stock: true },
    });
    expect(aAgain.stock).toBe(3);

    // Refund flips PAID -> REFUNDED only.
    const refunded = await fulfill.markRefunded(`pi_first_${suffix}`);
    expect(refunded.updated).toBe(true);
    const afterRefund = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { paymentStatus: true, status: true },
    });
    expect(afterRefund.paymentStatus).toBe("REFUNDED");
    expect(afterRefund.status).toBe("PAID");

    // A refunded order cannot be cancelled by the cancel page.
    expect((await fulfill.cancelPendingOrder(order.id)).cancelled).toBe(false);
  });

  it("locates an order via metadata.orderId when stripeSessionId was never stored", async () => {
    const order = await createPendingOrder({
      withSession: false,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    const session = fakeSession({
      payment_intent: { id: `pi_obj_${suffix}`, object: "payment_intent" },
      metadata: { orderId: order.id },
      shipping_details: null,
      customer_details: { email: `guest-${suffix}@example.com`, phone: null, name: null },
    });

    const result = await fulfill.fulfillOrderFromCheckoutSession(session);
    expect(result.outcome).toBe("fulfilled");

    const row = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: {
        stripeSessionId: true,
        stripePaymentIntentId: true,
        email: true,
        shippingLine1: true,
      },
    });
    expect(row.stripeSessionId).toBe(session.id);
    expect(row.stripePaymentIntentId).toBe(`pi_obj_${suffix}`);
    expect(row.email).toBe(`guest-${suffix}@example.com`);
    expect(row.shippingLine1).toBeNull();
  });

  it("still fulfils when the PaymentIntent id is already held by another order", async () => {
    const order = await createPendingOrder({
      withSession: true,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    // `pi_first_${suffix}` belongs to the order from the first test (unique column).
    const result = await fulfill.fulfillOrderFromCheckoutSession(
      fakeSession({ id: order.stripeSessionId, payment_intent: `pi_first_${suffix}` }),
    );
    expect(result.outcome).toBe("fulfilled");

    const row = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { paymentStatus: true, stripePaymentIntentId: true },
    });
    expect(row.paymentStatus).toBe("PAID");
    expect(row.stripePaymentIntentId).toBeNull();
  });

  it("returns not-found for an unknown session", async () => {
    const result = await fulfill.fulfillOrderFromCheckoutSession(
      fakeSession({ id: `cs_test_unknown_${suffix}`, metadata: {}, client_reference_id: null }),
    );
    expect(result.outcome).toBe("not-found");
  });

  it("cancels pending orders on expiry / abandonment and marks failures", async () => {
    const expired = await createPendingOrder({
      withSession: true,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    const expiredResult = await fulfill.cancelExpiredCheckout(
      fakeSession({ id: expired.stripeSessionId, payment_status: "unpaid" }),
    );
    expect(expiredResult).toEqual({ cancelled: true, orderId: expired.id });
    expect(
      (
        await prisma.order.findUniqueOrThrow({
          where: { id: expired.id },
          select: { status: true },
        })
      ).status,
    ).toBe("CANCELLED");

    const abandoned = await createPendingOrder({
      withSession: true,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    // Stripe is not configured in this environment, so no session expiry call is attempted.
    const abandonedResult = await fulfill.abandonCheckout(abandoned.id);
    expect(abandonedResult.cancelled).toBe(true);
    expect(abandonedResult.sessionExpired).toBe(false);
    expect((await fulfill.abandonCheckout(abandoned.id)).cancelled).toBe(false);

    const failed = await createPendingOrder({
      withSession: true,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    expect((await fulfill.markPaymentFailed(`pi_missing_${suffix}`, failed.id)).updated).toBe(true);
    const failedRow = await prisma.order.findUniqueOrThrow({
      where: { id: failed.id },
      select: { status: true, paymentStatus: true },
    });
    expect(failedRow).toEqual({ status: "PENDING", paymentStatus: "FAILED" });

    // A later successful payment in the same session still fulfils the order (FAILED -> PAID).
    const retried = await fulfill.fulfillOrderFromCheckoutSession(
      fakeSession({ id: failed.stripeSessionId, payment_intent: `pi_retry_${suffix}` }),
    );
    expect(retried.outcome).toBe("fulfilled");

    const asyncFailed = await createPendingOrder({
      withSession: true,
      withUser: false,
      items: [{ productId: productAId, quantity: 1, unitPrice: "10.00", title: "A" }],
    });
    const asyncResult = await fulfill.markCheckoutPaymentFailed(
      fakeSession({ id: asyncFailed.stripeSessionId, payment_status: "unpaid" }),
    );
    expect(asyncResult.updated).toBe(true);
    const asyncRow = await prisma.order.findUniqueOrThrow({
      where: { id: asyncFailed.id },
      select: { status: true, paymentStatus: true },
    });
    expect(asyncRow).toEqual({ status: "CANCELLED", paymentStatus: "FAILED" });
  });

  it("builds an escaped confirmation email from an OrderDetail", async () => {
    const order = await createPendingOrder({
      withSession: true,
      withUser: true,
      items: [{ productId: productBId, quantity: 1, unitPrice: "2.50", title: "Tea <script>" }],
    });
    const row = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: serialize.orderDetailSelect,
    });
    const content = emails.orderConfirmationEmail(serialize.toOrderDetail(row));

    expect(content.subject).toContain(order.orderNumber);
    expect(content.html).toContain("Tea &lt;script&gt;");
    expect(content.html).not.toContain("Tea <script>");
    expect(content.html).toContain("$2.50");
    expect(content.text).toContain(`Total: $2.50`);
    expect(content.text).toContain("/account/orders");
  });
});
