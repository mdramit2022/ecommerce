"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  type ActionState,
  type FieldErrors,
  errorState,
  formNullableString,
  formOptionalString,
  formString,
  successState,
  zodFieldErrors,
} from "@/lib/admin/forms";
import { isPrismaError } from "@/lib/admin/products";
import { safeAdminReturnTo, withMessage } from "@/lib/admin/search-params";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations/category";

const CATEGORIES_PATH = "/admin/categories";
const FIX_FIELDS = "Please fix the highlighted fields.";

type Outcome = { kind: "notice" | "error"; message: string };

function categoryFormToInput(formData: FormData) {
  return {
    name: formString(formData, "name"),
    slug: formOptionalString(formData, "slug"),
    description: formNullableString(formData, "description"),
    image: formNullableString(formData, "image"),
  };
}

function revalidateCategoryPaths(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(CATEGORIES_PATH);
  revalidatePath("/admin/products");
}

/** Map a P2002 unique violation to the offending field(s) when Prisma reports them. */
function uniqueConflictErrors(error: unknown): FieldErrors {
  const target =
    error instanceof Prisma.PrismaClientKnownRequestError && Array.isArray(error.meta?.target)
      ? error.meta.target.filter((field): field is string => typeof field === "string")
      : [];
  const fields = target.length > 0 ? target : ["name", "slug"];
  const out: FieldErrors = {};
  for (const field of fields) out[field] = [`A category with this ${field} already exists.`];
  return out;
}

/** Inline create form on /admin/categories. Stays on the page and reports success. */
export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = categorySchema.safeParse(categoryFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  const input = parsed.data;
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    return errorState(FIX_FIELDS, {
      slug: ["Could not derive a slug from the name; enter one manually."],
    });
  }

  try {
    await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        image: input.image ?? null,
      },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) return errorState(FIX_FIELDS, uniqueConflictErrors(error));
    console.error("[createCategory]", error);
    return errorState("Failed to create the category. Please try again.");
  }

  revalidateCategoryPaths();
  return successState(`Category "${input.name}" created.`);
}

/** Edit form on /admin/categories/[id]/edit. Redirects to the list on success. */
export async function updateCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const id = formString(formData, "id");
  if (!id) return errorState("Missing category id.");

  const parsed = categoryUpdateSchema.safeParse(categoryFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));
  const input = parsed.data;

  const data: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.image !== undefined) data.image = input.image;

  let name: string;
  try {
    const updated = await prisma.category.update({ where: { id }, data, select: { name: true } });
    name = updated.name;
  } catch (error) {
    if (isPrismaError(error, "P2025"))
      return errorState("Category not found. It may have been deleted.");
    if (isPrismaError(error, "P2002")) return errorState(FIX_FIELDS, uniqueConflictErrors(error));
    console.error("[updateCategory]", error);
    return errorState("Failed to save the category. Please try again.");
  }

  revalidateCategoryPaths();
  revalidatePath(`${CATEGORIES_PATH}/${id}/edit`);
  redirect(withMessage(CATEGORIES_PATH, "notice", `Category "${name}" updated.`));
}

/** Row action: delete a category. Refused while any product references it (FK is Restrict). */
export async function deleteCategory(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), CATEGORIES_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { name: true, _count: { select: { products: true } } },
    });

    if (!category) {
      outcome = { kind: "error", message: "Category not found." };
    } else if (category._count.products > 0) {
      outcome = {
        kind: "error",
        message: `"${category.name}" has ${category._count.products} product${category._count.products === 1 ? "" : "s"}. Move or delete them before deleting the category.`,
      };
    } else {
      await prisma.category.delete({ where: { id } });
      outcome = { kind: "notice", message: `Category "${category.name}" deleted.` };
    }
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      outcome = {
        kind: "error",
        message: "This category still has products and cannot be deleted.",
      };
    } else {
      console.error("[deleteCategory]", error);
      outcome = { kind: "error", message: "Failed to delete the category." };
    }
  }

  if (outcome.kind === "notice") revalidateCategoryPaths();
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}
