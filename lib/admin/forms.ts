import type { ZodError } from "zod";

/**
 * Helpers shared by Server Actions and the client forms that call them via `useActionState`.
 * No server-only imports here: Client Components import the types and `initialActionState`.
 */

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export const initialActionState: ActionState = { status: "idle" };

/** Signature of a Server Action usable with `useActionState`. */
export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function zodFieldErrors(error: ZodError): FieldErrors {
  return error.flatten().fieldErrors;
}

export function errorState(message: string, fieldErrors?: FieldErrors): ActionState {
  return { status: "error", message, fieldErrors };
}

export function successState(message: string): ActionState {
  return { status: "success", message };
}

// ───────────── FormData readers (trim strings, treat "" as absent) ─────────────

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formOptionalString(formData: FormData, key: string): string | undefined {
  const value = formString(formData, key);
  return value === "" ? undefined : value;
}

export function formNullableString(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  return value === "" ? null : value;
}

/** Empty -> undefined (lets Zod defaults/optional apply); non-numeric -> raw string (Zod reports "expected number"). */
export function formNumber(formData: FormData, key: string): number | string | undefined {
  const value = formString(formData, key);
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

/** Empty -> null (clears the column). */
export function formNullableNumber(formData: FormData, key: string): number | string | null {
  const value = formString(formData, key);
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export function formCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function formStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value !== "");
}
