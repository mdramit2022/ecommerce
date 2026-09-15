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
import { testimonialSchema } from "@/lib/validations/content";

const TESTIMONIALS_PATH = "/admin/testimonials";
const FIX_FIELDS = "Please fix the highlighted fields.";

type Outcome = { kind: "notice" | "error"; message: string };

function testimonialFormToInput(formData: FormData) {
  return {
    quote: formString(formData, "quote"),
    authorName: formString(formData, "authorName"),
    location: formString(formData, "location"),
    rating: formString(formData, "rating"),
    avatar: formString(formData, "avatar"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isActive: formCheckbox(formData, "isActive"),
  };
}

function revalidateTestimonialPaths(id?: string): void {
  revalidatePath("/");
  revalidatePath(TESTIMONIALS_PATH);
  if (id) revalidatePath(`${TESTIMONIALS_PATH}/${id}/edit`);
}

/** useActionState action for the "New testimonial" form. Redirects to the list on success. */
export async function createTestimonial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = testimonialSchema.safeParse(testimonialFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  try {
    await content.createTestimonial(parsed.data);
  } catch (error) {
    console.error("[createTestimonial]", error);
    return errorState("Failed to add the testimonial. Please try again.");
  }

  revalidateTestimonialPaths();
  redirect(
    withMessage(TESTIMONIALS_PATH, "notice", `Testimonial from ${parsed.data.authorName} added.`),
  );
}

/** useActionState action for the edit form (reads the hidden `id`). Stays on the page. */
export async function updateTestimonial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const id = formString(formData, "id");
  if (!id) return errorState("Missing testimonial id.");

  const parsed = testimonialSchema.safeParse(testimonialFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  try {
    await content.updateTestimonial(id, parsed.data);
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return errorState("Testimonial not found. It may have been deleted.");
    }
    console.error("[updateTestimonial]", error);
    return errorState("Failed to save the testimonial. Please try again.");
  }

  revalidateTestimonialPaths(id);
  return successState("Testimonial saved.");
}

/** Row action: show / hide. */
export async function toggleTestimonialActive(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), TESTIMONIALS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  try {
    const testimonial = await content.getTestimonial(id);
    if (!testimonial) {
      outcome = { kind: "error", message: "Testimonial not found." };
    } else {
      await content.setTestimonialActive(id, !testimonial.isActive);
      outcome = {
        kind: "notice",
        message: `${testimonial.authorName}'s testimonial is now ${testimonial.isActive ? "hidden" : "shown"}.`,
      };
    }
  } catch (error) {
    console.error("[toggleTestimonialActive]", error);
    outcome = { kind: "error", message: "Failed to update the testimonial." };
  }

  if (outcome.kind === "notice") revalidateTestimonialPaths(id);
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}

/** Row action: delete permanently. */
export async function deleteTestimonial(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), TESTIMONIALS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  try {
    const testimonial = await content.deleteTestimonial(id);
    outcome = { kind: "notice", message: `Testimonial from ${testimonial.authorName} deleted.` };
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      outcome = { kind: "error", message: "Testimonial not found." };
    } else {
      console.error("[deleteTestimonial]", error);
      outcome = { kind: "error", message: "Failed to delete the testimonial." };
    }
  }

  if (outcome.kind === "notice") revalidateTestimonialPaths();
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}
