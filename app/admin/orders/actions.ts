"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  type ActionState,
  errorState,
  formCheckbox,
  formString,
  successState,
  zodFieldErrors,
} from "@/lib/admin/forms";
import { transitionOrderStatus, updateOrderPaymentStatus } from "@/lib/admin/orders";
import { orderPaymentUpdateSchema, orderStatusUpdateSchema } from "@/lib/validations/order";

const orderStatusFormSchema = orderStatusUpdateSchema.extend({
  orderId: z.string().min(1, "Missing order id"),
});

/**
 * useActionState action behind <OrderStatusForm />.
 * Validates the transition with lib/orders/status.ts (via transitionOrderStatus). Cancelling a PAID
 * order marks the payment REFUNDED only when the admin ticked "mark as refunded"; no Stripe refund
 * is issued here.
 */
export async function updateOrderStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = orderStatusFormSchema.safeParse({
    orderId: formString(formData, "orderId"),
    status: formString(formData, "status"),
    markRefunded: formCheckbox(formData, "markRefunded"),
  });
  if (!parsed.success) return errorState("Invalid status update.", zodFieldErrors(parsed.error));

  const { orderId, ...input } = parsed.data;

  try {
    const result = await transitionOrderStatus(orderId, input);
    if (!result.ok) return errorState(result.error);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);

    return successState(result.message);
  } catch (error) {
    console.error("[updateOrderStatus]", error);
    return errorState("Failed to update the order. Please try again.");
  }
}

const orderPaymentFormSchema = orderPaymentUpdateSchema.extend({
  orderId: z.string().min(1, "Missing order id"),
});

/**
 * useActionState action behind <PaymentStatusForm />.
 *
 * Records a manually settled payment - cash collected by the courier, or a verified eSewa,
 * IME Pay or bank transfer. Stripe orders are refused by `updateOrderPaymentStatus`; their money
 * moves in the Stripe dashboard, not here.
 */
export async function updateOrderPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = orderPaymentFormSchema.safeParse({
    orderId: formString(formData, "orderId"),
    paymentStatus: formString(formData, "paymentStatus"),
    paymentReference: formString(formData, "paymentReference"),
  });
  if (!parsed.success) return errorState("Invalid payment update.", zodFieldErrors(parsed.error));

  const { orderId, ...input } = parsed.data;

  try {
    const result = await updateOrderPaymentStatus(orderId, input);
    if (!result.ok) return errorState(result.error);

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);

    return successState(result.message);
  } catch (error) {
    console.error("[updateOrderPayment]", error);
    return errorState("Failed to record the payment. Please try again.");
  }
}
