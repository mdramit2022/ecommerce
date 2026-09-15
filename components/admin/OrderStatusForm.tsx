"use client";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { useActionState, useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";

export type OrderStatusFormProps = {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Allowed targets computed server-side with nextOrderStatuses(currentStatus). */
  nextStatuses: OrderStatus[];
  action: FormAction;
};

/**
 * Client Component: lets an admin move an order to one of the allowed next statuses.
 * The "mark as refunded" option appears only when cancelling an order whose payment is PAID.
 */
export function OrderStatusForm({
  orderId,
  currentStatus,
  paymentStatus,
  nextStatuses,
  action,
}: OrderStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [selected, setSelected] = useState<string>(nextStatuses[0] ?? "");
  const id = useId();

  // Guard against a stale selection after the server re-renders with a new status.
  const effective = nextStatuses.find((status) => status === selected) ?? nextStatuses[0] ?? "";
  const showRefund = effective === "CANCELLED" && paymentStatus === "PAID";
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      {nextStatuses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This order is <span className="font-medium">{currentStatus}</span>; no further status
          changes are possible.
        </p>
      ) : (
        <>
          <Field
            id={`${id}-status`}
            label="New status"
            hint={`Current status: ${currentStatus}`}
            error={errors.status}
          >
            <Select
              id={`${id}-status`}
              name="status"
              value={effective}
              onChange={(e) => setSelected(e.target.value)}
            >
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          {showRefund && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <input
                type="checkbox"
                name="markRefunded"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300"
              />
              <span>
                Mark payment as <span className="font-medium">REFUNDED</span>. This only updates the
                record - issue the actual refund in the Stripe dashboard.
              </span>
            </label>
          )}

          <div>
            <Button type="submit" loading={pending} disabled={!effective}>
              Update status
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
