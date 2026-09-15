"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  type ActionState,
  errorState,
  formCheckbox,
  formNullableNumber,
  formNumber,
  formOptionalString,
  formString,
  formStringList,
  successState,
  zodFieldErrors,
} from "@/lib/admin/forms";
import { isPrismaError, productCreateData, productUpdateData } from "@/lib/admin/products";
import { safeAdminReturnTo, withMessage } from "@/lib/admin/search-params";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product";

const PRODUCTS_PATH = "/admin/products";
const FIX_FIELDS = "Please fix the highlighted fields.";

type Outcome = { kind: "notice" | "error"; message: string };

/** Shape the raw form fields so the shared Zod schemas can validate them. */
function productFormToInput(formData: FormData) {
  return {
    title: formString(formData, "title"),
    slug: formOptionalString(formData, "slug"),
    description: formString(formData, "description"),
    price: formNumber(formData, "price"),
    compareAtPrice: formNullableNumber(formData, "compareAtPrice"),
    stock: formNumber(formData, "stock"),
    images: formStringList(formData, "images"),
    categoryId: formString(formData, "categoryId"),
    isActive: formCheckbox(formData, "isActive"),
    isFeatured: formCheckbox(formData, "isFeatured"),
  };
}

function revalidateProductPaths(...slugs: (string | undefined)[]): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(PRODUCTS_PATH);
  for (const slug of slugs) {
    if (slug) revalidatePath(`/products/${slug}`);
  }
}

async function categoryExists(id: string): Promise<boolean> {
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  return category !== null;
}

/** useActionState action for the "New product" form. Redirects to the list on success. */
export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const parsed = productCreateSchema.safeParse(productFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));

  const input = parsed.data;
  const slug = input.slug ?? slugify(input.title);
  if (!slug) {
    return errorState(FIX_FIELDS, {
      slug: ["Could not derive a slug from the title; enter one manually."],
    });
  }

  try {
    if (!(await categoryExists(input.categoryId))) {
      return errorState(FIX_FIELDS, { categoryId: ["Category not found."] });
    }
    await prisma.product.create({ data: productCreateData(input, slug), select: { id: true } });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return errorState(FIX_FIELDS, { slug: ["A product with this slug already exists."] });
    }
    console.error("[createProduct]", error);
    return errorState("Failed to create the product. Please try again.");
  }

  revalidateProductPaths(slug);
  redirect(withMessage(PRODUCTS_PATH, "notice", `Product "${input.title}" created.`));
}

/** useActionState action for the edit form (reads the hidden `id`). Stays on the page on success. */
export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return errorState(guard.error);

  const id = formString(formData, "id");
  if (!id) return errorState("Missing product id.");

  const parsed = productUpdateSchema.safeParse(productFormToInput(formData));
  if (!parsed.success) return errorState(FIX_FIELDS, zodFieldErrors(parsed.error));
  const input = parsed.data;

  let previousSlug: string;
  try {
    const existing = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return errorState("Product not found. It may have been deleted.");
    previousSlug = existing.slug;

    if (input.categoryId !== undefined && !(await categoryExists(input.categoryId))) {
      return errorState(FIX_FIELDS, { categoryId: ["Category not found."] });
    }

    await prisma.product.update({
      where: { id },
      data: productUpdateData(input),
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return errorState(FIX_FIELDS, { slug: ["A product with this slug already exists."] });
    }
    if (isPrismaError(error, "P2025"))
      return errorState("Product not found. It may have been deleted.");
    console.error("[updateProduct]", error);
    return errorState("Failed to save the product. Please try again.");
  }

  revalidateProductPaths(previousSlug, input.slug);
  revalidatePath(`${PRODUCTS_PATH}/${id}/edit`);
  return successState("Product saved.");
}

/** Row action: flip isActive. Redirects back to the list with a notice. */
export async function toggleProductActive(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), PRODUCTS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  let slug: string | undefined;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { title: true, slug: true, isActive: true },
    });
    if (!product) {
      outcome = { kind: "error", message: "Product not found." };
    } else {
      await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
      slug = product.slug;
      outcome = {
        kind: "notice",
        message: `"${product.title}" is now ${product.isActive ? "inactive (hidden from the storefront)" : "active"}.`,
      };
    }
  } catch (error) {
    console.error("[toggleProductActive]", error);
    outcome = { kind: "error", message: "Failed to update the product." };
  }

  if (outcome.kind === "notice") revalidateProductPaths(slug);
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}

/**
 * Row action: delete a product.
 * Hard-deletes only when no order line references it; otherwise the product is deactivated
 * (soft delete) so order history stays intact (CLAUDE.md section 5.6).
 */
export async function deleteProduct(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), PRODUCTS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const id = formString(formData, "id");
  let outcome: Outcome;
  let slug: string | undefined;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        title: true,
        slug: true,
        isActive: true,
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      outcome = { kind: "error", message: "Product not found." };
    } else if (product._count.orderItems > 0) {
      if (product.isActive) {
        await prisma.product.update({ where: { id }, data: { isActive: false } });
      }
      slug = product.slug;
      outcome = {
        kind: "notice",
        message: `"${product.title}" appears in ${product._count.orderItems} order line(s) and cannot be deleted. It has been deactivated instead.`,
      };
    } else {
      // Cart items and reviews cascade; order items would block (Restrict) but there are none.
      await prisma.product.delete({ where: { id } });
      slug = product.slug;
      outcome = { kind: "notice", message: `"${product.title}" deleted.` };
    }
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      outcome = {
        kind: "error",
        message:
          "This product is referenced by orders and cannot be deleted. Deactivate it instead.",
      };
    } else {
      console.error("[deleteProduct]", error);
      outcome = { kind: "error", message: "Failed to delete the product." };
    }
  }

  if (outcome.kind === "notice") revalidateProductPaths(slug);
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}
