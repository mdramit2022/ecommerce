"use client";

import type { PaymentMethod } from "@prisma/client";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { PaymentMethodConfig } from "@/lib/payments/methods";
import { cn } from "@/lib/utils";

export type PaymentMethodSelectProps = {
  methods: readonly PaymentMethodConfig[];
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  /** Transaction id for eSewa / IME Pay / bank transfer. */
  reference: string;
  onReferenceChange: (value: string) => void;
  referenceError?: string;
  disabled?: boolean;
};

/**
 * Client Component: the payment menu on /checkout.
 *
 * One radio per available method. The selected card expands to show what the customer still has
 * to do, and asks for the transaction id when that method needs one (eSewa, IME Pay, bank
 * transfer). Cash on delivery and card payments need nothing extra.
 */
export function PaymentMethodSelect({
  methods,
  value,
  onChange,
  reference,
  onReferenceChange,
  referenceError,
  disabled = false,
}: PaymentMethodSelectProps) {
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">Payment method</legend>

      {methods.map((method) => {
        const selected = method.value === value;
        const inputId = `payment-${method.value}`;

        return (
          <div
            key={method.value}
            className={cn(
              "rounded-xl border bg-white transition",
              selected
                ? "border-neutral-900 ring-1 ring-neutral-900/10"
                : "border-neutral-200 hover:border-neutral-400",
            )}
          >
            <label
              htmlFor={inputId}
              className="flex cursor-pointer items-start gap-3 p-4 disabled:cursor-not-allowed"
            >
              <input
                id={inputId}
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={selected}
                onChange={() => onChange(method.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-neutral-900"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900">{method.label}</span>
                <span className="mt-0.5 block text-sm text-neutral-500">{method.tagline}</span>
              </span>
            </label>

            {selected && (
              <div className="border-t border-neutral-200 px-4 py-3">
                <ul className="space-y-1.5 text-sm text-neutral-600">
                  {method.instructions.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden="true" className="text-neutral-400">
                        &bull;
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                {method.requiresReference && (
                  <div className="mt-4">
                    <Label htmlFor="paymentReference" required>
                      {method.referenceLabel ?? "Transaction reference"}
                    </Label>
                    <Input
                      id="paymentReference"
                      name="paymentReference"
                      value={reference}
                      onChange={(event) => onReferenceChange(event.target.value)}
                      maxLength={100}
                      autoComplete="off"
                      aria-invalid={Boolean(referenceError) || undefined}
                      aria-describedby={
                        referenceError ? "paymentReference-error" : "paymentReference-hint"
                      }
                    />
                    {referenceError ? (
                      <p
                        id="paymentReference-error"
                        role="alert"
                        className="mt-1 text-xs text-rose-600"
                      >
                        {referenceError}
                      </p>
                    ) : (
                      method.referenceHint && (
                        <p id="paymentReference-hint" className="mt-1 text-xs text-neutral-500">
                          {method.referenceHint}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
