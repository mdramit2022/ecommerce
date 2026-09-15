import { z } from "zod";

/** Empty strings from HTML forms become `null` so optional columns are cleared, not stored as "". */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );

/** Body accepted by POST /api/addresses and the create-address Server Action. */
export const addressSchema = z.object({
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
    .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code (e.g. US)"),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .regex(/^[+\d\s().-]{5,30}$/, "Enter a valid phone number")
      .nullable()
      .optional(),
  ),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Body accepted by PATCH /api/addresses/[id]: any subset of the address fields. */
export const addressUpdateSchema = addressSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
