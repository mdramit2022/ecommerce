import { Alert } from "@/components/ui/Alert";
import { getPaymentMethod } from "@/lib/payments/methods";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderDetail } from "@/types/order";

export type PaymentInstructionsProps = {
  order: OrderDetail;
  className?: string;
};

/**
 * Server Component: what the customer still has to do for a manually settled order
 * (cash on delivery, eSewa, IME Pay, bank transfer).
 *
 * Renders nothing for card payments, or once the payment has been confirmed - a settled order
 * has no instructions left to follow.
 */
export function PaymentInstructions({ order, className }: PaymentInstructionsProps) {
  const method = getPaymentMethod(order.paymentMethod);
  if (!method.manual) return null;

  const currency = order.currency.toUpperCase();

  if (order.paymentStatus === "PAID") {
    return (
      <Alert tone="success" title={`Paid by ${method.label}`} className={className}>
        We have recorded your payment of {formatPrice(order.total, currency)}.
      </Alert>
    );
  }

  if (order.paymentStatus === "REFUNDED") {
    return (
      <Alert tone="info" title="Payment refunded" className={className}>
        {formatPrice(order.total, currency)} was refunded to you.
      </Alert>
    );
  }

  const failed = order.paymentStatus === "FAILED";

  return (
    <section
      aria-labelledby="payment-instructions"
      className={cn(
        "rounded-xl border px-5 py-4",
        failed ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50",
        className,
      )}
    >
      <h2
        id="payment-instructions"
        className={cn("text-base font-semibold", failed ? "text-rose-900" : "text-amber-900")}
      >
        {failed
          ? `We could not verify your ${method.label} payment`
          : order.paymentMethod === "CASH_ON_DELIVERY"
            ? "Have the payment ready"
            : `Complete your ${method.label} payment`}
      </h2>

      <p className={cn("mt-1 text-sm", failed ? "text-rose-800" : "text-amber-800")}>
        {failed
          ? "Send the payment again, or contact us with your receipt so we can check."
          : `Amount due: ${formatPrice(order.total, currency)}. Quote order ${order.orderNumber}.`}
      </p>

      <ul className={cn("mt-3 space-y-1.5 text-sm", failed ? "text-rose-800" : "text-amber-900")}>
        {method.instructions.map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="opacity-60">
              &bull;
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {order.paymentReference && method.referenceLabel && (
        <p className={cn("mt-3 text-sm", failed ? "text-rose-800" : "text-amber-900")}>
          {method.referenceLabel}:{" "}
          <span className="font-mono font-medium break-all">{order.paymentReference}</span>
        </p>
      )}
    </section>
  );
}
