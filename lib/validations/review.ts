import { z } from "zod";

/**
 * Body accepted by POST /api/products/[id]/reviews and PATCH /api/reviews/[id].
 * `comment` is trimmed; an empty or missing comment is stored as `null` by the handlers.
 */
export const reviewCreateSchema = z.object({
  rating: z
    .number({ invalid_type_error: "Rating must be a number" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().max(2000, "Comment must be 2000 characters or fewer").nullish(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

/** Query params accepted by GET /api/products/[id]/reviews */
export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
