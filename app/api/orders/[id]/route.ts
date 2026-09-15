import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrderDetail } from "@/lib/account/orders";

const idSchema = z.string().trim().min(1).max(64);

/**
 * GET /api/orders/[id]
 * Returns the order if it belongs to the caller; admins may fetch any order.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid order id", issues: parsedId.error.issues },
      { status: 400 },
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  try {
    const order = await getOrderDetail(parsedId.data, isAdmin ? null : session.user.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(
      { data: order },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
