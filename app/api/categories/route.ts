import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { adminCategorySelect, getPublicCategories, toAdminCategory } from "@/lib/admin/categories";
import { isPrismaError } from "@/lib/admin/products";
import { categorySchema } from "@/lib/validations/category";

/**
 * GET /api/categories
 * Public. All categories with their active product counts.
 */
export async function GET() {
  try {
    const data = await getPublicCategories();
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Admin only. Creates a category; `slug` is derived from `name` when omitted.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    return NextResponse.json(
      { error: "Could not derive a slug from the name; provide one explicitly" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        image: input.image ?? null,
      },
      select: adminCategorySelect,
    });
    return NextResponse.json({ data: toAdminCategory(row) }, { status: 201 });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 409 },
      );
    }
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
