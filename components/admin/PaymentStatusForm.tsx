"use client";

import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { useActionState, useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";

export type PaymentStatusFormProps = {
  orderId: string;
  paymentMethod: PaymentMethod;
  methodLabel: string;
  currentStatus: PaymentStatus;
  /** Allowed targets, computed server-side with nextPaymentStatuses(currentStatus). */
  nextStatuses: PaymentStatus[];
  /** What the reference field is called for this method, e.g. "eSewa transaction code". */
  referenceLabel: string | null;
  currentReference: string | null;
  action: FormAction;
};

const STATUS_HINTS: Partial<Record<PaymentStatus, string>> = {
  PAID: "The money arrived and was verified.",
  FAILED: "The transfer could not be verified.",
  UNPAID: "Reopen this payment so the customer can try again.",
  REFUNDED: "The money was sent back to the customer.",
};

/**
 * Client Component: records a manually settled payment (cash on delivery, eSewa, IME Pay, bank
 * transfer). Card payments never reach this form - Stripe and its webhook own those.
 */
export function PaymentStatusForm({
  orderId,
  paymentMethod,
  methodLabel,
  currentStatus,
  nextStatuses,
  referenceLabel,
  currentReference,
  action,
}: PaymentStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [selected, setSelected] = useState<string>(nextStatuses[0] ?? "");
  const id = useId();

  // Guard against a stale selection after the server re-renders with a new status.
  const effective = nextStatuses.find((status) => status === selected) ?? nextStatuses[0] ?? "";
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      {nextStatuses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This {methodLabel} payment is <span className="font-medium">{currentStatus}</span>; there
          is nothing left to record.
        </p>
      ) : (
        <>
          <Field
            id={`${id}-paymentStatus`}
            label="Payment outcome"
            hint={STATUS_HINTS[effective as PaymentStatus] ?? `Currently ${currentStatus}`}
            error={errors.paymentStatus}
          >
            <Select
              id={`${id}-paymentStatus`}
              name="paymentStatus"
              value={effective}
              onChange={(event) => setSelected(event.target.value)}
            >
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          {paymentMethod !== "CASH_ON_DELIVERY" && (
            <Field
              id={`${id}-paymentReference`}
              label={referenceLabel ?? "Transaction reference"}
              hint="What the customer sent, corrected if needed. Empty clears it."
              error={errors.paymentReference}
            >
              <Input
                id={`${id}-paymentReference`}
                name="paymentReference"
                defaultValue={currentReference ?? ""}
                maxLength={100}
                autoComplete="off"
              />
            </Field>
          )}

          <div>
            <Button type="submit" loading={pending} disabled={!effective}>
              Record payment
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
