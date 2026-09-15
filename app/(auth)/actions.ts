"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { resolveCallbackUrl } from "@/lib/users/auth-redirect";
import { registerUser } from "@/lib/users/register";
import { registerSchema, signInSchema } from "@/lib/validations/auth";

export type AuthFormState = {
  /** Form-level error (wrong credentials, email taken, ...). */
  error?: string;
  /** Per-field validation errors keyed by input name. */
  fieldErrors?: Record<string, string[]>;
  /** Non-sensitive values echoed back so the form can keep what the user typed. */
  values?: { name?: string; email?: string };
};

const SIGN_IN_FALLBACK = "/account";
const REGISTER_FALLBACK = "/account";

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

/** Map an Auth.js error to a user-facing message; anything else (e.g. NEXT_REDIRECT) is re-thrown. */
function signInErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return error.type === "CredentialsSignin" ? "Invalid email or password" : "Unable to sign in";
  }
  throw error;
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  const values = { email: field(formData, "email")?.trim() };

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const callbackUrl = resolveCallbackUrl(field(formData, "callbackUrl"), SIGN_IN_FALLBACK);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    return { error: signInErrorMessage(error), values };
  }

  // signIn redirects on success; reaching this point means it returned without redirecting.
  return { error: "Unable to sign in", values };
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  const values = {
    name: field(formData, "name")?.trim(),
    email: field(formData, "email")?.trim(),
  };

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const callbackUrl = resolveCallbackUrl(field(formData, "callbackUrl"), REGISTER_FALLBACK);

  let result: Awaited<ReturnType<typeof registerUser>>;
  try {
    result = await registerUser(parsed.data);
  } catch (error) {
    console.error("[registerAction]", error);
    return { error: "We could not create your account. Please try again.", values };
  }

  if (!result.ok) {
    return {
      error: "An account with this email already exists",
      fieldErrors: { email: ["An account with this email already exists"] },
      values,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    return { error: signInErrorMessage(error), values };
  }

  return { error: "Account created, but automatic sign-in failed. Please sign in.", values };
}

/** Form action for the "Continue with Google" button (only rendered when Google is configured). */
export async function googleSignInAction(formData: FormData): Promise<void> {
  const callbackUrl = resolveCallbackUrl(field(formData, "callbackUrl"), SIGN_IN_FALLBACK);
  await signIn("google", { redirectTo: callbackUrl });
}

/**
 * Sign the current user out and return to the storefront. Used by the header account menu and
 * the mobile drawer (passed down as a prop, since those are Client Components).
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
