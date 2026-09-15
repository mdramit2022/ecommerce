import { z } from "zod";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { PAYMENT_REFERENCE_MAX, paymentMethodSchema } from "@/lib/validations/checkout";

// Literal tuples (not the Prisma runtime enums) so this module has no `@prisma/client`
// runtime import and can be shared with Client Components if needed.
export const ORDER_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUS_VALUES = [
  "UNPAID",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

export const orderStatusSchema = z.enum(ORDER_STATUS_VALUES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUS_VALUES);

/** Payment statuses an admin may set by hand on a manually paid order. */
export const MANUAL_PAYMENT_STATUS_VALUES = [
  "PAID",
  "FAILED",
  "UNPAID",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

/** Body accepted by PATCH /api/admin/orders/[id] and by the admin status form. */
export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
  /**
   * When cancelling a PAID order, also mark the payment as REFUNDED.
   * This only updates the record - no Stripe refund is issued.
   */
  markRefunded: z.boolean().default(false),
});
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

/**
 * Body accepted by PATCH /api/admin/orders/[id] when recording a manual payment
 * (cash on delivery, bank transfer, eSewa, IME Pay) and by the admin payment form.
 */
export const orderPaymentUpdateSchema = z.object({
  paymentStatus: z.enum(MANUAL_PAYMENT_STATUS_VALUES),
  /** Transaction id / deposit slip the admin verified against. Empty clears the stored value. */
  paymentReference: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(PAYMENT_REFERENCE_MAX).nullable().optional(),
  ),
});
export type OrderPaymentUpdateInput = z.infer<typeof orderPaymentUpdateSchema>;

/** PATCH /api/admin/orders/[id] accepts either a status change or a payment update. */
export const adminOrderUpdateSchema = z.union([orderStatusUpdateSchema, orderPaymentUpdateSchema]);
export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;

/** Query params accepted by GET /api/orders and /account/orders (the caller's own orders). */
export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

/** Query params accepted by GET /api/admin/orders and /admin/orders. */
export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  /** Matches order number, customer email or shipping name. */
  q: z.string().trim().min(1).max(100).optional(),
});
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
