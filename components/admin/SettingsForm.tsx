"use client";

import { useActionState, useId } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";
import { SITE_SETTING_FIELDS, type SiteSettings } from "@/lib/content/kinds";

export type SettingsFormProps = {
  action: FormAction;
  settings: SiteSettings;
};

/** Client Component: the store settings form (contact details and store numbers). */
export function SettingsForm({ action, settings }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const idPrefix = useId();
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "error" && state.message && (
        <Alert tone="danger" title="Could not save settings">
          {state.message}
        </Alert>
      )}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        {SITE_SETTING_FIELDS.map((field) => {
          const id = `${idPrefix}-${field.prop}`;
          const value = settings[field.prop];
          return (
            <Field
              key={field.key}
              id={id}
              label={field.label}
              required
              error={errors[field.prop]}
              hint={field.hint}
              className={
                field.type === "url" ||
                field.prop === "addressLine" ||
                field.prop === "newsletterBlurb"
                  ? "sm:col-span-2"
                  : undefined
              }
            >
              <Input
                id={id}
                name={field.prop}
                type={field.type}
                defaultValue={String(value)}
                required
                inputMode={field.type === "number" ? "numeric" : undefined}
                min={field.type === "number" ? 0 : undefined}
                step={field.type === "number" ? 1 : undefined}
                aria-invalid={errors[field.prop] ? true : undefined}
              />
            </Field>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-6">
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
        <p className="text-xs text-neutral-500">Changes show on every page immediately.</p>
      </div>
    </form>
  );
}
