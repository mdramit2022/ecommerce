import { Prisma } from "@prisma/client";
import type { OrderDetailRow, OrderItemRow, OrderSummaryRow } from "@/lib/orders/serialize";
import type { toProductCardData } from "@/lib/serializers";

/**
 * Factories for Prisma row shapes used by serializer tests.
 * Every factory returns a complete row with sensible defaults; pass `overrides` to vary a field.
 * Money fields are real `Prisma.Decimal` instances so the Decimal -> number conversion is exercised.
 */

export type ProductCardRow = Parameters<typeof toProductCardData>[0];

export const decimal = (value: string | number): Prisma.Decimal => new Prisma.Decimal(value);

export const FIXED_DATE = new Date("2026-09-10T12:34:56.789Z");
export const LATER_DATE = new Date("2026-09-11T08:00:00.000Z");

export function makeProductCardRow(overrides: Partial<ProductCardRow> = {}): ProductCardRow {
  return {
    id: "prod_tee",
    title: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    price: decimal("24.00"),
    compareAtPrice: decimal("32.00"),
    stock: 120,
    images: ["https://images.example.com/tee-front.jpg", "https://images.example.com/tee-back.jpg"],
    category: { name: "Apparel", slug: "apparel" },
    ...overrides,
  };
}

export function makeOrderItemRow(overrides: Partial<OrderItemRow> = {}): OrderItemRow {
  return {
    id: "item_1",
    productId: "prod_tee",
    title: "Classic Cotton Tee",
    image: "https://images.example.com/tee-front.jpg",
    unitPrice: decimal("19.99"),
    quantity: 2,
    product: { slug: "classic-cotton-tee" },
    ...overrides,
  };
}

export function makeOrderSummaryRow(overrides: Partial<OrderSummaryRow> = {}): OrderSummaryRow {
  return {
    id: "order_1",
    orderNumber: "ORD-20260910-7F3KQ2",
    status: "PAID",
    paymentStatus: "PAID",
    paymentMethod: "STRIPE",
    total: decimal("123.45"),
    currency: "usd",
    createdAt: FIXED_DATE,
    _count: { items: 3 },
    ...overrides,
  };
}

export function makeOrderDetailRow(overrides: Partial<OrderDetailRow> = {}): OrderDetailRow {
  return {
    id: "order_1",
    orderNumber: "ORD-20260910-7F3KQ2",
    userId: "user_1",
    email: "customer@example.com",
    status: "PAID",
    paymentStatus: "PAID",
    paymentMethod: "STRIPE",
    paymentReference: null,
    subtotal: decimal("39.98"),
    shippingCost: decimal("5.00"),
    tax: decimal("3.60"),
    total: decimal("48.58"),
    currency: "usd",
    stripeSessionId: "cs_test_123",
    stripePaymentIntentId: "pi_test_123",
    shippingName: null,
    shippingLine1: null,
    shippingLine2: null,
    shippingCity: null,
    shippingState: null,
    shippingPostalCode: null,
    shippingCountry: null,
    shippingPhone: null,
    createdAt: FIXED_DATE,
    updatedAt: LATER_DATE,
    items: [makeOrderItemRow()],
    user: { id: "user_1", name: "Demo Customer", email: "customer@example.com" },
    ...overrides,
  };
}

/** A fully populated shipping snapshot, as written by the Stripe webhook. */
export const FULL_SHIPPING = {
  shippingName: "Demo Customer",
  shippingLine1: "1 Market St",
  shippingLine2: "Suite 200",
  shippingCity: "San Francisco",
  shippingState: "CA",
  shippingPostalCode: "94105",
  shippingCountry: "US",
  shippingPhone: "+1 415 555 0100",
} satisfies Partial<OrderDetailRow>;
