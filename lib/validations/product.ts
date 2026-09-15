import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Product / category image reference.
 * Accepts absolute http(s) URLs plus the root-relative `/uploads/<file>` paths returned by
 * POST /api/upload. (`z.string().url()` alone would also accept e.g. `javascript:` URLs.)
 */
export const productImageSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("/uploads/") ? /^\/uploads\/[A-Za-z0-9._-]+$/.test(value) : isHttpUrl(value),
    { message: "Must be an http(s) URL or an uploaded /uploads/ path" },
  );

/** Query params accepted by GET /api/products */
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  category: z.string().trim().min(1).optional(), // category slug
  q: z.string().trim().min(1).max(100).optional(), // search term
  sort: z.enum(["newest", "price-asc", "price-desc", "title"]).default("newest"),
  /** Only featured products ("Best Sellers"). */
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  /** Only products with a compare-at price above the selling price ("Offers"). */
  onSale: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  /** Admin only: also return inactive products. Silently ignored for non-admin callers. */
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Body accepted by POST /api/products (admin) */
export const productCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  description: z.string().trim().min(10).max(5000),
  price: z.number().positive().multipleOf(0.01),
  compareAtPrice: z.number().positive().multipleOf(0.01).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  images: z.array(productImageSchema).max(10).default([]),
  categoryId: z.string().min(1),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

/**
 * Body accepted by PATCH /api/products/[id] (admin).
 * Every field is optional; omitted fields are left untouched.
 */
export const productUpdateSchema = productCreateSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
  });
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/** Query params accepted by the admin product list (/admin/products). */
export const adminProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).optional(), // category slug
  status: z.enum(["all", "active", "inactive"]).default("all"),
});
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
