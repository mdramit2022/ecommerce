import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listUserOrders } from "@/lib/account/orders";
import { orderListQuerySchema } from "@/lib/validations/order";

/**
 * GET /api/orders?page=1&limit=10
 * Signed-in users only. Returns the caller's own orders, newest first.
 */
export async function GET(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const parsed = orderListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const body = await listUserOrders(guard.userId, parsed.data);
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
