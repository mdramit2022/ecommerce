"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type ActionState, type FormAction, initialActionState } from "@/lib/admin/forms";
import type { AdminCategory } from "@/lib/admin/types";
import { slugify } from "@/lib/utils";

export type CategoryFormProps = {
  /** Server Action: createCategory or updateCategory (reads the hidden `id` field). */
  action: FormAction;
  category?: AdminCategory | null;
  submitLabel?: string;
  /** Inline create form: clear the fields after a successful submission. */
  resetOnSuccess?: boolean;
  /** Compact single-row layout for the inline create form. */
  compact?: boolean;
};

type Values = { name: string; slug: string; description: string; image: string };

function initialValues(category: AdminCategory | null | undefined): Values {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
  };
}

/** Client Component: category create/edit form driven by a Server Action via `useActionState`. */
export function CategoryForm({
  action,
  category,
  submitLabel,
  resetOnSuccess = false,
  compact = false,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [values, setValues] = useState<Values>(() => initialValues(category));
  // Reset the controlled inputs once per successful submission (derived-state pattern, no effect).
  const [handledState, setHandledState] = useState<ActionState>(state);
  if (state !== handledState) {
    setHandledState(state);
    if (resetOnSuccess && state.status === "success") setValues(initialValues(null));
  }

  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const errors = state.fieldErrors ?? {};
  const derivedSlug = slugify(values.name);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {category && <input type="hidden" name="id" value={category.id} />}

      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className={compact ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-5"}>
        <Field id={fieldId("name")} label="Name" required error={errors.name}>
          <Input
            id={fieldId("name")}
            name="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
            minLength={2}
            maxLength={80}
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>

        <Field
          id={fieldId("slug")}
          label="Slug"
          error={errors.slug}
          hint={
            values.slug
              ? `Storefront filter: /shop?category=${values.slug}`
              : derivedSlug
                ? `Leave empty to use "${derivedSlug}"`
                : "Lowercase letters, numbers and hyphens"
          }
        >
          <Input
            id={fieldId("slug")}
            name="slug"
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder={derivedSlug || "auto-generated-from-name"}
            maxLength={80}
            aria-invalid={errors.slug ? true : undefined}
          />
        </Field>

        <Field id={fieldId("description")} label="Description" error={errors.description}>
          <Textarea
            id={fieldId("description")}
            name="description"
            rows={compact ? 2 : 4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={500}
            aria-invalid={errors.description ? true : undefined}
          />
        </Field>

        <Field
          id={fieldId("image")}
          label="Image URL"
          error={errors.image}
          hint="Optional; https URL or an /uploads/ path"
        >
          <Input
            id={fieldId("image")}
            name="image"
            value={values.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="https://example.com/category.jpg"
            aria-invalid={errors.image ? true : undefined}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {submitLabel ?? (category ? "Save changes" : "Create category")}
        </Button>
        {category && (
          <Link
            href="/admin/categories"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
