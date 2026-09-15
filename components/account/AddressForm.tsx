"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { initialActionState, type ActionState } from "@/lib/account/action-state";
import type { AddressData } from "@/lib/account/addresses";

export type AddressFormProps = {
  /** Server Action (already bound to an address id when editing). */
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Existing address when editing; omit when creating. */
  initial?: AddressData | null;
  submitLabel?: string;
};

type TextFieldName =
  "fullName" | "line1" | "line2" | "city" | "state" | "postalCode" | "country" | "phone";

/**
 * Client Component: add / edit address form driven by `useActionState`.
 * Field values survive a failed submission because the action echoes them back in `state.values`.
 */
export function AddressForm({
  action,
  initial = null,
  submitLabel = "Save address",
}: AddressFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const valueOf = (name: TextFieldName): string => state.values?.[name] ?? initial?.[name] ?? "";

  const errorOf = (name: string) => state.fieldErrors?.[name];

  const defaultChecked = state.values
    ? state.values.isDefault === "on"
    : (initial?.isDefault ?? false);
  const lockedDefault = initial?.isDefault === true;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}

      <Field id="fullName" label="Full name" required error={errorOf("fullName")}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          defaultValue={valueOf("fullName")}
          aria-invalid={Boolean(errorOf("fullName")) || undefined}
        />
      </Field>

      <Field id="line1" label="Address line 1" required error={errorOf("line1")}>
        <Input
          id="line1"
          name="line1"
          autoComplete="address-line1"
          required
          defaultValue={valueOf("line1")}
          aria-invalid={Boolean(errorOf("line1")) || undefined}
        />
      </Field>

      <Field
        id="line2"
        label="Address line 2"
        error={errorOf("line2")}
        hint="Apartment, suite, unit (optional)"
      >
        <Input
          id="line2"
          name="line2"
          autoComplete="address-line2"
          defaultValue={valueOf("line2")}
          aria-invalid={Boolean(errorOf("line2")) || undefined}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="city" label="City" required error={errorOf("city")}>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            required
            defaultValue={valueOf("city")}
            aria-invalid={Boolean(errorOf("city")) || undefined}
          />
        </Field>
        <Field id="state" label="State / Province" error={errorOf("state")}>
          <Input
            id="state"
            name="state"
            autoComplete="address-level1"
            defaultValue={valueOf("state")}
            aria-invalid={Boolean(errorOf("state")) || undefined}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="postalCode" label="Postal code" required error={errorOf("postalCode")}>
          <Input
            id="postalCode"
            name="postalCode"
            autoComplete="postal-code"
            required
            defaultValue={valueOf("postalCode")}
            aria-invalid={Boolean(errorOf("postalCode")) || undefined}
          />
        </Field>
        <Field
          id="country"
          label="Country"
          required
          error={errorOf("country")}
          hint="2-letter ISO code, e.g. US, GB, DE"
        >
          <Input
            id="country"
            name="country"
            autoComplete="country"
            required
            maxLength={2}
            placeholder="US"
            className="uppercase"
            defaultValue={valueOf("country")}
            aria-invalid={Boolean(errorOf("country")) || undefined}
          />
        </Field>
      </div>

      <Field
        id="phone"
        label="Phone"
        error={errorOf("phone")}
        hint="Optional, used for delivery questions"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={valueOf("phone")}
          aria-invalid={Boolean(errorOf("phone")) || undefined}
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-neutral-800">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-neutral-900"
          defaultChecked={defaultChecked}
          disabled={lockedDefault}
        />
        <span>
          Use as my default shipping address
          {lockedDefault && (
            <span className="block text-xs text-neutral-500">
              This is already your default. Set another address as default to change it.
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Link href="/account/addresses" className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
