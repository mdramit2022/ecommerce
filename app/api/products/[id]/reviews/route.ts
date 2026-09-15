import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { reviewSelect, toReviewData } from "@/lib/reviews/serialize";
import { reviewCreateSchema, reviewListQuerySchema } from "@/lib/validations/review";
import type { PaginatedResponse } from "@/types/product";
import type { ReviewData } from "@/types/review";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id]/reviews?page=1&limit=10
 * Public. Reviews for a product, newest first, with the reviewer's name and avatar.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id: productId } = await params;

  const parsed = reviewListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { page, limit } = parsed.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const where = { productId };
    const [rows, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const body: PaginatedResponse<ReviewData> = {
      data: rows.map(toReviewData),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[GET /api/products/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

/**
 * POST /api/products/[id]/reviews
 * Signed-in users only. One review per user per product: a second POST updates the
 * existing review (200) instead of failing; a first POST creates it (201).
 * Rate limited to 10 requests per minute per user.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const limit = rateLimit(`reviews:post:${guard.userId}`, { limit: 10, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { id: productId } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reviewCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { rating } = parsed.data;
  const comment = parsed.data.comment ? parsed.data.comment : null;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, isActive: true },
    });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const uniqueKey = { userId_productId: { userId: guard.userId, productId } };

    const existing = await prisma.review.findUnique({ where: uniqueKey, select: { id: true } });

    const review = await prisma.review.upsert({
      where: uniqueKey,
      create: { rating, comment, userId: guard.userId, productId },
      update: { rating, comment },
      select: reviewSelect,
    });

    revalidatePath(`/products/${product.slug}`);

    return NextResponse.json(
      { data: toReviewData(review) },
      { status: existing ? 200 : 201, headers: rateLimitHeaders(limit) },
    );
  } catch (error) {
    console.error("[POST /api/products/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
