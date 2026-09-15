import { z } from "zod";
import type { CartData, CartItemData, CartResponse } from "@/types/cart";

/** Upper bounds shared by the server-side cart (PUT /api/cart) and POST /api/checkout. */
export const CART_MAX_LINES = 50;
export const CART_MAX_LINE_QUANTITY = 99;

/** Body accepted by PUT /api/cart - replaces the whole cart. An empty array clears it. */
export const cartReplaceSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(CART_MAX_LINE_QUANTITY),
      }),
    )
    .max(CART_MAX_LINES),
});
export type CartReplaceInput = z.infer<typeof cartReplaceSchema>;

/** Runtime guards for `/api/cart` responses, used by the client sync code. */
export const cartItemDataSchema = z.object({
  productId: z.string(),
  title: z.string(),
  slug: z.string(),
  price: z.number(),
  image: z.string().nullable(),
  stock: z.number().int(),
  quantity: z.number().int(),
}) satisfies z.ZodType<CartItemData>;

export const cartDataSchema = z.object({
  items: z.array(cartItemDataSchema),
  subtotal: z.number(),
}) satisfies z.ZodType<CartData>;

export const cartResponseSchema = z.object({
  data: cartDataSchema,
}) satisfies z.ZodType<CartResponse>;
