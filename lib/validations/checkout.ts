import { z } from "zod";
import { PAYMENT_METHOD_VALUES } from "@/lib/payments/methods";
import { CART_MAX_LINE_QUANTITY, CART_MAX_LINES } from "@/lib/validations/cart";

/**
 * Schemas for placing an order (POST /api/checkout) and for reading the checkout result pages.
 *
 * Only product IDs and quantities are trusted from the client; prices always come from the DB.
 * Limits are shared with the cart schema so any cart that syncs can also check out.
 */

/** One list of methods, kept in `lib/payments/methods.ts` so the menu and the schema cannot drift. */
export const paymentMethodSchema = z.enum(PAYMENT_METHOD_VALUES);

export const PAYMENT_REFERENCE_MAX = 100;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

/** Shipping details collected on /checkout. Stored as the order's shipping snapshot. */
export const checkoutShippingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  line1: z.string().trim().min(3, "Street address is required").max(200),
  line2: optionalText(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: optionalText(100),
  postalCode: z.string().trim().min(2, "Postal code is required").max(20),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code (e.g. NP)"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s().-]{5,30}$/, "Enter a valid phone number")
    .max(30),
});
export type CheckoutShippingInput = z.infer<typeof checkoutShippingSchema>;

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(CART_MAX_LINE_QUANTITY),
    }),
  )
  .min(1, "Cart is empty")
  .max(CART_MAX_LINES);

/**
 * Body accepted by POST /api/checkout.
 *
 * Every method needs a contact email and a shipping address: manual methods (cash on delivery,
 * eSewa, IME Pay, bank transfer) have no provider to collect them, and for Stripe the snapshot is
 * a useful fallback until the webhook reports what Stripe collected.
 *
 * Wallet and bank transfers additionally require the transaction id the admin verifies against.
 */
export const checkoutSchema = z
  .object({
    items: checkoutItemsSchema,
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
    paymentMethod: paymentMethodSchema,
    paymentReference: optionalText(PAYMENT_REFERENCE_MAX),
    shipping: checkoutShippingSchema,
    /** Save the shipping address to the signed-in customer's address book. Ignored for guests. */
    saveAddress: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const needsReference =
      data.paymentMethod === "ESEWA" ||
      data.paymentMethod === "IME_PAY" ||
      data.paymentMethod === "BANK_TRANSFER";

    if (needsReference && !data.paymentReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentReference"],
        message: "Enter the transaction id or reference from your payment receipt",
      });
    }
    if (!needsReference && data.paymentReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentReference"],
        message: "This payment method does not take a transaction reference",
      });
    }
  });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

const sessionIdSchema = z
  .string()
  .max(255)
  .regex(/^cs_[A-Za-z0-9_]+$/, "Invalid Stripe Checkout Session id");

const orderIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid order id");

/**
 * Query string of /checkout/success. Stripe redirects with `session_id=cs_...`; orders placed with
 * a manual payment method are redirected with `order_id=<cuid>`.
 */
export const checkoutSuccessQuerySchema = z
  .object({
    session_id: sessionIdSchema.optional(),
    order_id: orderIdSchema.optional(),
  })
  .refine((data) => Boolean(data.session_id ?? data.order_id), {
    message: "Either session_id or order_id is required",
    path: ["session_id"],
  });
export type CheckoutSuccessQuery = z.infer<typeof checkoutSuccessQuerySchema>;

/** Query string of /checkout/cancel. `order_id` is the cuid of the order created by POST /api/checkout. */
export const checkoutCancelQuerySchema = z.object({
  order_id: orderIdSchema.optional(),
});
export type CheckoutCancelQuery = z.infer<typeof checkoutCancelQuerySchema>;
