"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveSiteSettings } from "@/lib/admin/content";
import {
  type ActionState,
  errorState,
  formString,
  successState,
  zodFieldErrors,
} from "@/lib/admin/forms";
import { SITE_SETTING_FIELDS } from "@/lib/content/kinds";
import { siteSettingsSchema } from "@/lib/validations/content";

/** useActionState action behind <SettingsForm />. Settings render in the shell on every page. */
export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const raw: Record<string, string> = {};
  for (const field of SITE_SETTING_FIELDS) raw[field.prop] = formString(formData, field.prop);

  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return errorState("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    await saveSiteSettings(parsed.data);
  } catch (error) {
    console.error("[saveSettings]", error);
    return errorState("Failed to save settings. Please try again.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return successState("Settings saved.");
}
