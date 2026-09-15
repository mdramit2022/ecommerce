import { z } from "zod";

/** Normalised email: trimmed, lowercased, validated. */
const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(254, "Email is too long");

/**
 * Password strength rule shared by registration (`registerSchema`) and the account
 * change-password form (`lib/validations/user.ts`). Sign-in only checks length.
 */
export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

/** Body accepted by the sign-in form / credentials provider. */
export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});
export type SignInInput = z.infer<typeof signInSchema>;

/** Body accepted by POST /api/auth/register and the registration form. */
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name must be at most 80 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export type SanitizeCallbackUrlOptions = {
  /** Origins (e.g. "https://shop.example.com") whose absolute URLs may be reduced to a path. */
  allowedOrigins?: readonly string[];
  /** Returned when the value is missing or unsafe. Defaults to "/". */
  fallback?: string;
};

/** True when the string contains ASCII control characters (0x00-0x1f, 0x7f). */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

const AUTH_PAGES = /^\/(sign-in|register)(?:[/?#]|$)/;

/**
 * Only allow same-site redirects after sign-in.
 *
 * Accepts a relative path that starts with a single "/" (rejecting protocol-relative
 * "//host" and "/\host" tricks), or an absolute URL whose origin is in `allowedOrigins`
 * (Auth.js middleware sets `callbackUrl` to the full request href). The auth pages themselves
 * are never used as a target, to avoid redirect loops.
 */
export function sanitizeCallbackUrl(
  value: unknown,
  options: SanitizeCallbackUrlOptions = {},
): string {
  const fallback = options.fallback ?? "/";
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (trimmed.length === 0 || hasControlChars(trimmed)) return fallback;

  let candidate = trimmed;

  if (!candidate.startsWith("/")) {
    // Absolute URL: allowed only for our own origin(s), then reduced to a path.
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      return fallback;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;
    if (!options.allowedOrigins?.includes(parsed.origin)) return fallback;
    candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  if (AUTH_PAGES.test(candidate)) return fallback;

  return candidate;
}
