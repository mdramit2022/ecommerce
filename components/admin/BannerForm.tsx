"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import type { BannerPlacement } from "@prisma/client";
import { ImageField } from "@/components/admin/ImageField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";
import {
  BANNER_PLACEMENTS,
  BANNER_PLACEMENT_META,
  BANNER_THEMES,
  BANNER_THEME_META,
  DEFAULT_BANNER_THEME,
  type BannerField,
} from "@/lib/content/kinds";
import type { BannerData } from "@/types/content";

export type BannerFormProps = {
  /** Server Action: createBanner or updateBanner (reads the hidden `id`). */
  action: FormAction;
  banner?: BannerData | null;
  /** Pre-selected placement for the create form (from `?placement=`). */
  defaultPlacement?: BannerPlacement;
};

type Values = {
  placement: BannerPlacement;
  eyebrow: string;
  title: string;
  titleAccent: string;
  highlight: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  theme: string;
  sortOrder: string;
  isActive: boolean;
};

function initialValues(banner: BannerData | null | undefined, placement: BannerPlacement): Values {
  return {
    placement: banner?.placement ?? placement,
    eyebrow: banner?.eyebrow ?? "",
    title: banner?.title ?? "",
    titleAccent: banner?.titleAccent ?? "",
    highlight: banner?.highlight ?? "",
    description: banner?.description ?? "",
    image: banner?.image ?? "",
    ctaLabel: banner?.ctaLabel ?? "",
    ctaHref: banner?.ctaHref ?? "",
    secondaryLabel: banner?.secondaryLabel ?? "",
    secondaryHref: banner?.secondaryHref ?? "",
    theme: banner?.theme ?? "",
    sortOrder: String(banner?.sortOrder ?? 0),
    isActive: banner?.isActive ?? true,
  };
}

/**
 * Client Component: create/edit form for a home-page banner. The placement decides which fields
 * are shown (a hero slide has two buttons and an accent line; a promo tile has a colour theme).
 */
export function BannerForm({ action, banner, defaultPlacement = "HERO" }: BannerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [values, setValues] = useState<Values>(() => initialValues(banner, defaultPlacement));
  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const errors = state.fieldErrors ?? {};
  const meta = BANNER_PLACEMENT_META[values.placement];
  const shows = (field: BannerField) => meta.fields.includes(field);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      {state.status === "error" && state.message && (
        <Alert tone="danger" title="Could not save banner">
          {state.message}
        </Alert>
      )}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-5">
          <Field
            id={fieldId("placement")}
            label="Where it shows"
            required
            error={errors.placement}
            hint={meta.hint}
          >
            <Select
              id={fieldId("placement")}
              name="placement"
              value={values.placement}
              onChange={(e) => set("placement", e.target.value as BannerPlacement)}
              disabled={Boolean(banner)}
            >
              {BANNER_PLACEMENTS.map((placement) => (
                <option key={placement} value={placement}>
                  {BANNER_PLACEMENT_META[placement].label}
                </option>
              ))}
            </Select>
            {banner && <input type="hidden" name="placement" value={values.placement} />}
          </Field>

          {shows("eyebrow") && (
            <Field
              id={fieldId("eyebrow")}
              label={values.placement === "HERO" ? "Badge text" : "Small heading"}
              error={errors.eyebrow}
              hint={
                values.placement === "HERO"
                  ? 'The green pill above the title, e.g. "Premium Quality"'
                  : 'e.g. "Cookware Collection"'
              }
            >
              <Input
                id={fieldId("eyebrow")}
                name="eyebrow"
                value={values.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
                maxLength={60}
                aria-invalid={errors.eyebrow ? true : undefined}
              />
            </Field>
          )}

          <Field id={fieldId("title")} label="Title" required error={errors.title}>
            <Input
              id={fieldId("title")}
              name="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={120}
              aria-invalid={errors.title ? true : undefined}
            />
          </Field>

          {shows("titleAccent") && (
            <Field
              id={fieldId("titleAccent")}
              label="Accent line"
              error={errors.titleAccent}
              hint='Second line of the title in orange, e.g. "Kitchen Needs"'
            >
              <Input
                id={fieldId("titleAccent")}
                name="titleAccent"
                value={values.titleAccent}
                onChange={(e) => set("titleAccent", e.target.value)}
                maxLength={80}
                aria-invalid={errors.titleAccent ? true : undefined}
              />
            </Field>
          )}

          {shows("highlight") && (
            <Field
              id={fieldId("highlight")}
              label="Highlight"
              error={errors.highlight}
              hint='Large gold line, e.g. "Up to 40% OFF"'
            >
              <Input
                id={fieldId("highlight")}
                name="highlight"
                value={values.highlight}
                onChange={(e) => set("highlight", e.target.value)}
                maxLength={60}
                aria-invalid={errors.highlight ? true : undefined}
              />
            </Field>
          )}

          {shows("description") && (
            <Field id={fieldId("description")} label="Description" error={errors.description}>
              <Textarea
                id={fieldId("description")}
                name="description"
                rows={3}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={300}
                aria-invalid={errors.description ? true : undefined}
              />
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={fieldId("ctaLabel")} label="Button label" error={errors.ctaLabel}>
              <Input
                id={fieldId("ctaLabel")}
                name="ctaLabel"
                value={values.ctaLabel}
                onChange={(e) => set("ctaLabel", e.target.value)}
                maxLength={40}
                placeholder="Shop Now"
                aria-invalid={errors.ctaLabel ? true : undefined}
              />
            </Field>
            <Field
              id={fieldId("ctaHref")}
              label="Button link"
              error={errors.ctaHref}
              hint="Site path like /shop?category=cookware or an https:// URL"
            >
              <Input
                id={fieldId("ctaHref")}
                name="ctaHref"
                value={values.ctaHref}
                onChange={(e) => set("ctaHref", e.target.value)}
                placeholder="/shop"
                aria-invalid={errors.ctaHref ? true : undefined}
              />
            </Field>
          </div>

          {shows("secondaryLabel") && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id={fieldId("secondaryLabel")}
                label="Second button label"
                error={errors.secondaryLabel}
              >
                <Input
                  id={fieldId("secondaryLabel")}
                  name="secondaryLabel"
                  value={values.secondaryLabel}
                  onChange={(e) => set("secondaryLabel", e.target.value)}
                  maxLength={40}
                  placeholder="Explore Categories"
                  aria-invalid={errors.secondaryLabel ? true : undefined}
                />
              </Field>
              <Field
                id={fieldId("secondaryHref")}
                label="Second button link"
                error={errors.secondaryHref}
              >
                <Input
                  id={fieldId("secondaryHref")}
                  name="secondaryHref"
                  value={values.secondaryHref}
                  onChange={(e) => set("secondaryHref", e.target.value)}
                  placeholder="/shop"
                  aria-invalid={errors.secondaryHref ? true : undefined}
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <ImageField
            id={fieldId("image")}
            name="image"
            label="Image"
            required
            value={values.image}
            onChange={(url) => set("image", url)}
            error={errors.image}
            previewClassName={
              values.placement === "SIDEBAR" ? "aspect-[3/5] max-w-[240px]" : "aspect-[16/7]"
            }
          />

          {shows("theme") && (
            <Field
              id={fieldId("theme")}
              label="Colour theme"
              error={errors.theme}
              hint="Gradient behind the text; the image shows through it"
            >
              <Select
                id={fieldId("theme")}
                name="theme"
                value={values.theme}
                onChange={(e) => set("theme", e.target.value)}
              >
                <option value="">
                  Default ({BANNER_THEME_META[DEFAULT_BANNER_THEME[values.placement]].label})
                </option>
                {BANNER_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {BANNER_THEME_META[theme].label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={fieldId("sortOrder")}
              label="Order"
              error={errors.sortOrder}
              hint="Lower numbers show first"
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
                Active (shown on the home page)
              </label>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-6">
        <Button type="submit" loading={pending}>
          {banner ? "Save changes" : "Create banner"}
        </Button>
        <Link href="/admin/banners" className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm text-neutral-600 hover:text-neutral-900"
        >
          View home page
        </Link>
      </div>
    </form>
  );
}
