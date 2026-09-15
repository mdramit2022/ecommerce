import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/** Serialisable order shapes shared by Server Components, Client Components and API responses. */

export type OrderItemData = {
  id: string;
  productId: string;
  productSlug: string | null;
  title: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type ShippingAddressData = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string; // ISO 8601
};

export type OrderDetail = OrderSummary & {
  userId: string | null;
  email: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  /** Customer-supplied transaction id for a manual transfer (bank, eSewa, IME Pay). */
  paymentReference: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  shippingAddress: ShippingAddressData | null;
  items: OrderItemData[];
  customer: { id: string; name: string | null; email: string } | null;
  updatedAt: string; // ISO 8601
};
