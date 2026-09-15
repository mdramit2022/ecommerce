"use server";

import type { SiteContentKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import * as content from "@/lib/admin/content";
import { formCheckbox, formString } from "@/lib/admin/forms";
import { isPrismaError } from "@/lib/admin/products";
import { safeAdminReturnTo, withMessage } from "@/lib/admin/search-params";
import { SITE_CONTENT_KINDS, SITE_CONTENT_KIND_META } from "@/lib/content/kinds";
import { siteContentItemSchema } from "@/lib/validations/content";

const CONTENT_PATH = "/admin/content";

type Outcome = { kind: "notice" | "error"; message: string };

/** Content items appear in the shell on every page, so the whole layout is refreshed. */
function revalidateContentPaths(): void {
  revalidatePath("/", "layout");
  revalidatePath(CONTENT_PATH);
}

function finish(returnTo: string, outcome: Outcome): never {
  if (outcome.kind === "notice") revalidateContentPaths();
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}

/**
 * Row form on /admin/content: creates when the hidden `id` is empty, otherwise updates.
 * The inline editor has no per-field error display, so validation problems come back as one
 * flash message naming the field.
 */
export async function saveContentItem(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), CONTENT_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id") || null;
  const parsed = siteContentItemSchema.safeParse({
    kind: formString(formData, "kind"),
    group: formString(formData, "group"),
    title: formString(formData, "title"),
    subtitle: formString(formData, "subtitle"),
    href: formString(formData, "href"),
    icon: formString(formData, "icon"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isActive: formCheckbox(formData, "isActive"),
  });

  if (!parsed.success) {
    const rawKind = formString(formData, "kind");
    const kindLabel = (SITE_CONTENT_KINDS as readonly string[]).includes(rawKind)
      ? SITE_CONTENT_KIND_META[rawKind as SiteContentKind].label
      : "Item";
    const first = parsed.error.issues[0];
    const field = first ? String(first.path[0] ?? "") : "";
    return finish(returnTo, {
      kind: "error",
      message: `${kindLabel} not saved${field ? ` - ${field}` : ""}: ${first?.message ?? "invalid input"}.`,
    });
  }

  const label = SITE_CONTENT_KIND_META[parsed.data.kind].label;
  try {
    await content.saveContentItem(id, parsed.data);
  } catch (error) {
    if (isPrismaError(error, "P2025"))
      return finish(returnTo, { kind: "error", message: `${label} not found.` });
    console.error("[saveContentItem]", error);
    return finish(returnTo, {
      kind: "error",
      message: `Failed to save the ${label.toLowerCase()}.`,
    });
  }

  return finish(returnTo, { kind: "notice", message: `${label} ${id ? "saved" : "added"}.` });
}

/** Row action: show / hide an item. */
export async function toggleContentItemActive(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), CONTENT_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  try {
    const items = await content.listContentItems();
    const item = items.find((entry) => entry.id === id);
    if (!item) return finish(returnTo, { kind: "error", message: "Item not found." });
    await content.setContentItemActive(id, !item.isActive);
    return finish(returnTo, {
      kind: "notice",
      message: `${SITE_CONTENT_KIND_META[item.kind].label} is now ${item.isActive ? "hidden" : "shown"}.`,
    });
  } catch (error) {
    console.error("[toggleContentItemActive]", error);
    return finish(returnTo, { kind: "error", message: "Failed to update the item." });
  }
}

/** Row action: delete an item permanently. */
export async function deleteContentItem(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), CONTENT_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  try {
    const item = await content.deleteContentItem(id);
    return finish(returnTo, {
      kind: "notice",
      message: `${SITE_CONTENT_KIND_META[item.kind].label} deleted.`,
    });
  } catch (error) {
    if (isPrismaError(error, "P2025"))
      return finish(returnTo, { kind: "error", message: "Item not found." });
    console.error("[deleteContentItem]", error);
    return finish(returnTo, { kind: "error", message: "Failed to delete the item." });
  }
}
