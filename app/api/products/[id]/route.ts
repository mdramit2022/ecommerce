import { NextResponse, type NextRequest } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError, productUpdateData, toProductDetail } from "@/lib/admin/products";
import { productDetailSelect } from "@/lib/serializers";
import { productUpdateSchema } from "@/lib/validations/product";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id]
 * Public: returns an active product (with category). Admins also see inactive products.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const [session, row] = await Promise.all([
      auth(),
      prisma.product.findUnique({ where: { id }, select: productDetailSelect }),
    ]);
    const isAdmin = session?.user?.role === "ADMIN";

    if (!row || (!row.isActive && !isAdmin)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { data: toProductDetail(row) },
      {
        headers: {
          "Cache-Control": isAdmin
            ? "private, no-store"
            : "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/products/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

/**
 * PATCH /api/products/[id]
 * Admin only. Partial update; `slug` may be omitted (unchanged) or set explicitly.
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

  const parsed = productUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    if (input.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    // Note: an omitted `slug` keeps the existing one - renaming a product must not silently
    // break its public URL. Clients that want a new slug send it explicitly.
    const row = await prisma.product.update({
      where: { id },
      data: productUpdateData(input),
      select: productDetailSelect,
    });

    return NextResponse.json({ data: toProductDetail(row) });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/products/[id]]", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 * Admin only. Soft delete: sets isActive=false so order history stays intact.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  try {
    const row = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    return NextResponse.json({ data: row });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[DELETE /api/products/[id]]", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
