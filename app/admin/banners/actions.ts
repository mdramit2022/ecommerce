"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import * as content from "@/lib/admin/content";
import {
  type ActionState,
  errorState,
  formCheckbox,
  formString,
  successState,
  zodFieldErrors,
} from "@/lib/admin/forms";
import { isPrismaError } from "@/lib/admin/products";
import { safeAdminReturnTo, withMessage } from "@/lib/admin/search-params";
import { bannerSchema } from "@/lib/validations/content";

const BANNERS_PATH = "/admin/banners";
const FIX_FIELDS = "Please fix the highlighted fields.";

type Outcome = { kind: "notice" | "error"; message: string };

function bannerFormToInput(formData: FormData) {
  return {
    placement: formString(formData, "placement"),
    eyebrow: formString(formData, "eyebrow"),
    title: formString(formData, "title"),
    titleAccent: formString(formData, "titleAccent"),
    highlight: formString(formData, "highlight"),
    description: formString(formData, "description"),
    image: formString(formData, "image"),
    ctaLabel: formString(formData, "ctaLabel"),
    ctaHref: formString(formData, "ctaHref"),
    secondaryLabel: formString(formData, "secondaryLabel"),
    secondaryHref: formString(formData, "secondaryHref"),
    theme: formString(formData, "theme"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isActive: formCheckbox(formData, "isActive"),
  };
}

/** Banners render on the home page, so both the page and the admin list need refreshing. */
function revalidateBannerPaths(id?: string): void {
  revalidatePath("/");
  revalidatePath(BANNERS_PATH);
  if (id) revalidatePath(`${BANNERS_PATH}/${id}/edit`);
}

/** useActionState action for the "New banner" form. Redirects to the list on success. */
export async function createBanner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = bannerSchema.safeParse(bannerFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  try {
    await content.createBanner(parsed.data);
  } catch (error) {
    console.error("[createBanner]", error);
    return errorState("Failed to create the banner. Please try again.");
  }

  revalidateBannerPaths();
  redirect(withMessage(BANNERS_PATH, "notice", `Banner "${parsed.data.title}" created.`));
}

/** useActionState action for the edit form (reads the hidden `id`). Stays on the page. */
export async function updateBanner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const id = formString(formData, "id");
  if (!id) return errorState("Missing banner id.");

  const parsed = bannerSchema.safeParse(bannerFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  try {
    await content.updateBanner(id, parsed.data);
  } catch (error) {
    if (isPrismaError(error, "P2025"))
      return errorState("Banner not found. It may have been deleted.");
    console.error("[updateBanner]", error);
    return errorState("Failed to save the banner. Please try again.");
  }

  revalidateBannerPaths(id);
  return successState("Banner saved.");
}

/** Row action: show / hide a banner. Redirects back to the list with a notice. */
export async function toggleBannerActive(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), BANNERS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  try {
    const banner = await content.getBanner(id);
    if (!banner) {
      outcome = { kind: "error", message: "Banner not found." };
    } else {
      await content.setBannerActive(id, !banner.isActive);
      outcome = {
        kind: "notice",
        message: `"${banner.title}" is now ${banner.isActive ? "hidden" : "shown"} on the home page.`,
      };
    }
  } catch (error) {
    console.error("[toggleBannerActive]", error);
    outcome = { kind: "error", message: "Failed to update the banner." };
  }

  if (outcome.kind === "notice") revalidateBannerPaths(id);
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}

/** Row action: delete a banner permanently. */
export async function deleteBanner(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), BANNERS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  try {
    const banner = await content.deleteBanner(id);
    outcome = { kind: "notice", message: `Banner "${banner.title}" deleted.` };
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      outcome = { kind: "error", message: "Banner not found." };
    } else {
      console.error("[deleteBanner]", error);
      outcome = { kind: "error", message: "Failed to delete the banner." };
    }
  }

  if (outcome.kind === "notice") revalidateBannerPaths();
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}
