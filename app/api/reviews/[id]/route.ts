import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, requireUser } from "@/lib/auth";
import { reviewSelect, toReviewData } from "@/lib/reviews/serialize";
import { reviewCreateSchema } from "@/lib/validations/review";

type RouteContext = { params: Promise<{ id: string }> };

const ownerSelect = { userId: true, product: { select: { slug: true } } } as const;

/**
 * PATCH /api/reviews/[id]
 * Owner only. Replaces the rating and comment (same schema as create).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireUser();
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
    const existing = await prisma.review.findUnique({ where: { id }, select: ownerSelect });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existing.userId !== guard.userId) {
      return NextResponse.json({ error: "You can only edit your own reviews" }, { status: 403 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { rating, comment },
      select: reviewSelect,
    });

    revalidatePath(`/products/${existing.product.slug}`);

    return NextResponse.json({ data: toReviewData(review) });
  } catch (error) {
    console.error("[PATCH /api/reviews/[id]]", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews/[id]
 * Owner or ADMIN.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.review.findUnique({ where: { id }, select: ownerSelect });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You can only delete your own reviews" }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });

    revalidatePath(`/products/${existing.product.slug}`);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("[DELETE /api/reviews/[id]]", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
