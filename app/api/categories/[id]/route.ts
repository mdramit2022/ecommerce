import type { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminCategorySelect, toAdminCategory } from "@/lib/admin/categories";
import { isPrismaError } from "@/lib/admin/products";
import { categoryUpdateSchema } from "@/lib/validations/category";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/categories/[id]
 * Admin only. Partial update (name, slug, description, image).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = categoryUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const data: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.image !== undefined) data.image = input.image;

  try {
    const row = await prisma.category.update({ where: { id }, data, select: adminCategorySelect });
    return NextResponse.json({ data: toAdminCategory(row) });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/categories/[id]]", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Admin only. Refused (409) while any product references the category (FK is Restrict).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { products: true } } },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: `Category has ${category._count.products} product(s). Move or delete them before deleting the category.`,
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (isPrismaError(error, "P2003")) {
      return NextResponse.json(
        { error: "Category still has products and cannot be deleted" },
        { status: 409 },
      );
    }
    console.error("[DELETE /api/categories/[id]]", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
