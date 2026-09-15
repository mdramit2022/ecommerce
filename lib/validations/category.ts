import { z } from "zod";
import { productImageSchema } from "@/lib/validations/product";

export const categorySlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

/** Body accepted by POST /api/categories and the admin category form. */
export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  /** Optional - derived from `name` when omitted. */
  slug: categorySlugSchema.optional(),
  description: z.string().trim().max(500).nullable().optional(),
  image: productImageSchema.nullable().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

/** Body accepted by PATCH /api/categories/[id]. */
export const categoryUpdateSchema = categorySchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
  });
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
