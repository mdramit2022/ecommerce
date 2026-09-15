import { env } from "@/lib/env";
import { sanitizeCallbackUrl } from "@/lib/validations/auth";

/** Origins that count as "this site" when a callbackUrl arrives as an absolute URL. */
function appOrigins(): string[] {
  const origins = new Set<string>();
  for (const value of [env.NEXT_PUBLIC_APP_URL, env.AUTH_URL]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // env.ts already validated these as URLs; ignore anything malformed anyway.
    }
  }
  return [...origins];
}

/**
 * Server-only: turn a raw `callbackUrl` (query param or hidden form field) into a safe
 * same-site path, falling back to `fallback`.
 */
export function resolveCallbackUrl(raw: unknown, fallback = "/"): string {
  return sanitizeCallbackUrl(raw, { allowedOrigins: appOrigins(), fallback });
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with your email and password instead.",
  AccessDenied: "You do not have permission to sign in.",
  CredentialsSignin: "Invalid email or password.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
};

const GENERIC_AUTH_ERROR = "Something went wrong while signing you in. Please try again.";

/**
 * Human-readable message for the `?error=` code Auth.js appends to the sign-in page
 * after a failed OAuth / callback flow. Returns null when there is no error.
 */
export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? GENERIC_AUTH_ERROR;
}
