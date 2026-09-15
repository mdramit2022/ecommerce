"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useId, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { type FormAction, initialActionState } from "@/lib/admin/forms";
import type { AdminProduct, CategoryOption } from "@/lib/admin/types";
import { slugify } from "@/lib/utils";

export type ProductFormProps = {
  /** Server Action: createProduct or updateProduct (reads the hidden `id` field). */
  action: FormAction;
  categories: CategoryOption[];
  /** Existing product for the edit form; omit for the create form. */
  product?: AdminProduct | null;
  submitLabel?: string;
};

type Values = {
  title: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
};

const MAX_IMAGES = 10;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

function initialValues(
  product: AdminProduct | null | undefined,
  categories: CategoryOption[],
): Values {
  return {
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? product.price.toFixed(2) : "",
    compareAtPrice: product?.compareAtPrice != null ? product.compareAtPrice.toFixed(2) : "",
    stock: product ? String(product.stock) : "0",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  };
}

/** Narrow the JSON returned by POST /api/upload without `any`. */
function readUploadResponse(json: unknown): { url?: string; error?: string } {
  if (typeof json !== "object" || json === null) return {};
  const body = json as Record<string, unknown>;
  const data = body.data;
  const url =
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).url === "string"
      ? String((data as Record<string, unknown>).url)
      : undefined;
  const error = typeof body.error === "string" ? body.error : undefined;
  return { url, error };
}

/**
 * Client Component: create/edit product form driven by a Server Action via `useActionState`.
 * Inputs are controlled so a failed submission keeps what the admin typed.
 */
export function ProductForm({ action, categories, product, submitLabel }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [values, setValues] = useState<Values>(() => initialValues(product, categories));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const errors = state.fieldErrors ?? {};
  const derivedSlug = slugify(values.title);

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    if (images.includes(url)) {
      setImageError("That image is already in the list.");
      return;
    }
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
    setImageError(null);
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const moveImage = (index: number, direction: -1 | 1) =>
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      const swapped = next[target];
      if (current === undefined || swapped === undefined) return prev;
      next[index] = swapped;
      next[target] = current;
      return next;
    });

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      input.value = "";
      return;
    }

    setUploading(true);
    setImageError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const json: unknown = await response.json().catch(() => null);
      const { url, error } = readUploadResponse(json);
      if (!response.ok || !url) {
        setImageError(error ?? "Upload failed. Please try again.");
        return;
      }
      setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    } catch {
      setImageError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {product && <input type="hidden" name="id" value={product.id} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      {state.status === "error" && state.message && (
        <Alert tone="danger" title="Could not save product">
          {state.message}
        </Alert>
      )}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Field id={fieldId("title")} label="Title" required error={errors.title}>
            <Input
              id={fieldId("title")}
              name="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={200}
              aria-invalid={errors.title ? true : undefined}
            />
          </Field>

          <Field
            id={fieldId("slug")}
            label="Slug"
            error={errors.slug}
            hint={
              values.slug
                ? `Public URL: /products/${values.slug}`
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
              placeholder={derivedSlug || "auto-generated-from-title"}
              maxLength={200}
              aria-invalid={errors.slug ? true : undefined}
            />
          </Field>

          <Field
            id={fieldId("description")}
            label="Description"
            required
            error={errors.description}
          >
            <Textarea
              id={fieldId("description")}
              name="description"
              rows={8}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              required
              minLength={10}
              maxLength={5000}
              aria-invalid={errors.description ? true : undefined}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field id={fieldId("price")} label="Price (Rs.)" required error={errors.price}>
              <Input
                id={fieldId("price")}
                name="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                required
                aria-invalid={errors.price ? true : undefined}
              />
            </Field>
            <Field
              id={fieldId("compareAtPrice")}
              label="Compare-at price"
              error={errors.compareAtPrice}
              hint="Optional; shown struck through"
            >
              <Input
                id={fieldId("compareAtPrice")}
                name="compareAtPrice"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={values.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                aria-invalid={errors.compareAtPrice ? true : undefined}
              />
            </Field>
            <Field id={fieldId("stock")} label="Stock" required error={errors.stock}>
              <Input
                id={fieldId("stock")}
                name="stock"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={values.stock}
                onChange={(e) => set("stock", e.target.value)}
                required
                aria-invalid={errors.stock ? true : undefined}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Field id={fieldId("categoryId")} label="Category" required error={errors.categoryId}>
            <Select
              id={fieldId("categoryId")}
              name="categoryId"
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              required
              aria-invalid={errors.categoryId ? true : undefined}
            >
              {categories.length === 0 && <option value="">No categories yet</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
            <legend className="px-1 text-sm font-medium text-neutral-800">Visibility</legend>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                name="isActive"
                checked={values.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Active (visible in the storefront)
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                name="isFeatured"
                checked={values.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Featured
            </label>
          </fieldset>

          <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-800">
                Images{" "}
                <span className="font-normal text-neutral-500">
                  ({images.length}/{MAX_IMAGES})
                </span>
              </p>
            </div>

            {images.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No images yet. The first image is the cover.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {images.map((url, index) => (
                  <li
                    key={url}
                    className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-2"
                  >
                    <Image
                      src={url}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-neutral-700" title={url}>
                      {index === 0 && (
                        <span className="mr-1 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                          Cover
                        </span>
                      )}
                      {url}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move image ${index + 1} up`}
                      >
                        Up
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label={`Move image ${index + 1} down`}
                      >
                        Down
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Input
                aria-label="Image URL"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button variant="secondary" onClick={addImage} disabled={!newImageUrl.trim()}>
                Add
              </Button>
            </div>

            <label className="flex flex-col gap-1 text-sm text-neutral-800">
              <span className="font-medium">Upload image</span>
              {/* No `name` on purpose: the file must go to /api/upload, not into the Server Action payload. */}
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleUpload}
                disabled={uploading || images.length >= MAX_IMAGES}
                className="block w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-neutral-800 hover:file:bg-neutral-200 disabled:opacity-60"
              />
              <span className="text-xs text-neutral-500">
                {uploading ? "Uploading..." : "JPEG, PNG, WebP or GIF up to 5 MB."}
              </span>
            </label>

            {(imageError || errors.images) && (
              <p role="alert" className="text-xs text-rose-600">
                {imageError ?? errors.images?.[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-6">
        <Button type="submit" loading={pending} disabled={uploading}>
          {submitLabel ?? (product ? "Save changes" : "Create product")}
        </Button>
        <Link href="/admin/products" className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
        {product && (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-sm text-neutral-600 hover:text-neutral-900"
          >
            View in store
          </Link>
        )}
      </div>
    </form>
  );
}
