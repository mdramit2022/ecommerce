import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { productCardSelect, toProductCardData } from "@/lib/serializers";
import { productCreateSchema, productListQuerySchema } from "@/lib/validations/product";
import type { PaginatedResponse, ProductCardData } from "@/types/product";

const sortMap = {
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  title: { title: "asc" },
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

/**
 * GET /api/products?page=1&limit=12&category=<slug>&q=<search>&sort=newest&featured=true&onSale=true
 * Public. Returns active products, paginated.
 * `includeInactive=true` also returns inactive products, but only for ADMIN callers
 * (silently ignored otherwise).
 */
export async function GET(request: NextRequest) {
  const parsed = productListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { page, limit, category, q, sort, featured, onSale, includeInactive } = parsed.data;

  let showInactive = false;
  if (includeInactive) {
    const session = await auth();
    showInactive = session?.user?.role === "ADMIN";
  }

  const where: Prisma.ProductWhereInput = {
    ...(showInactive ? {} : { isActive: true }),
    ...(category ? { category: { slug: category } } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(onSale ? { compareAtPrice: { gt: prisma.product.fields.price } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        select: productCardSelect,
        orderBy: sortMap[sort],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const body: PaginatedResponse<ProductCardData> = {
      data: rows.map(toProductCardData),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": showInactive
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Admin only. Creates a product.
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

  const parsed = productCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const slug = input.slug ?? slugify(input.title);

  try {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        compareAtPrice:
          input.compareAtPrice != null ? new Prisma.Decimal(input.compareAtPrice) : null,
        stock: input.stock,
        images: input.images,
        categoryId: input.categoryId,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
      },
      select: productCardSelect,
    });

    return NextResponse.json({ data: toProductCardData(product) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
