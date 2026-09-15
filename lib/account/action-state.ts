import type { ZodError } from "zod";

/**
 * Result shape returned by every account Server Action and consumed by `useActionState` forms.
 * `values` echoes the submitted text fields so a failed form can be re-rendered without data loss.
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { status: "idle" };

export function zodFieldErrors(error: ZodError): FieldErrors {
  return error.flatten().fieldErrors;
}

/** Pick the named string fields out of a FormData (non-string entries are ignored). */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
