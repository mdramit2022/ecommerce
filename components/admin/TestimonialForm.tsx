"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ImageField } from "@/components/admin/ImageField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";
import type { TestimonialData } from "@/types/content";

export type TestimonialFormProps = {
  /** Server Action: createTestimonial or updateTestimonial (reads the hidden `id`). */
  action: FormAction;
  testimonial?: TestimonialData | null;
};

type Values = {
  quote: string;
  authorName: string;
  location: string;
  rating: string;
  avatar: string;
  sortOrder: string;
  isActive: boolean;
};

function initialValues(testimonial: TestimonialData | null | undefined): Values {
  return {
    quote: testimonial?.quote ?? "",
    authorName: testimonial?.authorName ?? "",
    location: testimonial?.location ?? "",
    rating: String(testimonial?.rating ?? 5),
    avatar: testimonial?.avatar ?? "",
    sortOrder: String(testimonial?.sortOrder ?? 0),
    isActive: testimonial?.isActive ?? true,
  };
}

/** Client Component: create/edit form for a customer testimonial on the home page. */
export function TestimonialForm({ action, testimonial }: TestimonialFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [values, setValues] = useState<Values>(() => initialValues(testimonial));
  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}

      {state.status === "error" && state.message && (
        <Alert tone="danger" title="Could not save testimonial">
          {state.message}
        </Alert>
      )}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-5">
          <Field id={fieldId("quote")} label="Quote" required error={errors.quote}>
            <Textarea
              id={fieldId("quote")}
              name="quote"
              rows={4}
              value={values.quote}
              onChange={(e) => set("quote", e.target.value)}
              required
              minLength={10}
              maxLength={500}
              aria-invalid={errors.quote ? true : undefined}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={fieldId("authorName")}
              label="Customer name"
              required
              error={errors.authorName}
            >
              <Input
                id={fieldId("authorName")}
                name="authorName"
                value={values.authorName}
                onChange={(e) => set("authorName", e.target.value)}
                required
                maxLength={80}
                aria-invalid={errors.authorName ? true : undefined}
              />
            </Field>
            <Field
              id={fieldId("location")}
              label="Location"
              error={errors.location}
              hint="e.g. Kathmandu"
            >
              <Input
                id={fieldId("location")}
                name="location"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                maxLength={80}
                aria-invalid={errors.location ? true : undefined}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field id={fieldId("rating")} label="Stars" required error={errors.rating}>
              <Select
                id={fieldId("rating")}
                name="rating"
                value={values.rating}
                onChange={(e) => set("rating", e.target.value)}
              >
                {[5, 4, 3, 2, 1].map((stars) => (
                  <option key={stars} value={stars}>
                    {stars} {stars === 1 ? "star" : "stars"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id={fieldId("sortOrder")}
              label="Order"
              error={errors.sortOrder}
              hint="Lower shows first"
            >
              <Input
                id={fieldId("sortOrder")}
                name="sortOrder"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                aria-invalid={errors.sortOrder ? true : undefined}
              />
            </Field>
            <fieldset className="flex flex-col justify-end gap-3 rounded-lg border border-neutral-200 p-4">
              <legend className="px-1 text-sm font-medium text-neutral-800">Visibility</legend>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={values.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Active
              </label>
            </fieldset>
          </div>
        </div>

        <ImageField
          id={fieldId("avatar")}
          name="avatar"
          label="Customer photo"
          value={values.avatar}
          onChange={(url) => set("avatar", url)}
          error={errors.avatar}
          hint="Optional. A square photo works best."
          previewClassName="aspect-square max-w-[160px]"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-6">
        <Button type="submit" loading={pending}>
          {testimonial ? "Save changes" : "Add testimonial"}
        </Button>
        <Link
          href="/admin/testimonials"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
