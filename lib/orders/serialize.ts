import type { Prisma } from "@prisma/client";
import type { OrderDetail, OrderItemData, OrderSummary, ShippingAddressData } from "@/types/order";

/**
 * Shared Prisma selects + serializers for orders.
 * Use these in customer, admin and payment code so every surface renders the same shape.
 */

export const orderItemSelect = {
  id: true,
  productId: true,
  title: true,
  image: true,
  unitPrice: true,
  quantity: true,
  product: { select: { slug: true } },
} satisfies Prisma.OrderItemSelect;

export const orderSummarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  total: true,
  currency: true,
  createdAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

export const orderDetailSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  email: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentReference: true,
  subtotal: true,
  shippingCost: true,
  tax: true,
  total: true,
  currency: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  shippingName: true,
  shippingLine1: true,
  shippingLine2: true,
  shippingCity: true,
  shippingState: true,
  shippingPostalCode: true,
  shippingCountry: true,
  shippingPhone: true,
  createdAt: true,
  updatedAt: true,
  items: { select: orderItemSelect, orderBy: { title: "asc" } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderSelect;

export type OrderSummaryRow = Prisma.OrderGetPayload<{ select: typeof orderSummarySelect }>;
export type OrderDetailRow = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>;
export type OrderItemRow = Prisma.OrderItemGetPayload<{ select: typeof orderItemSelect }>;

export function toOrderItemData(row: OrderItemRow): OrderItemData {
  const unitPrice = row.unitPrice.toNumber();
  return {
    id: row.id,
    productId: row.productId,
    productSlug: row.product?.slug ?? null,
    title: row.title,
    image: row.image,
    unitPrice,
    quantity: row.quantity,
    lineTotal: Math.round(unitPrice * row.quantity * 100) / 100,
  };
}

export function toOrderSummary(row: OrderSummaryRow): OrderSummary {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    total: row.total.toNumber(),
    currency: row.currency,
    itemCount: row._count.items,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toOrderDetail(row: OrderDetailRow): OrderDetail {
  const hasAddress = Boolean(row.shippingLine1 || row.shippingCity || row.shippingCountry);
  const shippingAddress: ShippingAddressData | null = hasAddress
    ? {
        name: row.shippingName,
        line1: row.shippingLine1,
        line2: row.shippingLine2,
        city: row.shippingCity,
        state: row.shippingState,
        postalCode: row.shippingPostalCode,
        country: row.shippingCountry,
        phone: row.shippingPhone,
      }
    : null;

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    total: row.total.toNumber(),
    currency: row.currency,
    itemCount: row.items.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
    email: row.email,
    subtotal: row.subtotal.toNumber(),
    shippingCost: row.shippingCost.toNumber(),
    tax: row.tax.toNumber(),
    paymentReference: row.paymentReference,
    stripeSessionId: row.stripeSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    shippingAddress,
    items: row.items.map(toOrderItemData),
    customer: row.user ? { id: row.user.id, name: row.user.name, email: row.user.email } : null,
  };
}
