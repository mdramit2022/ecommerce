import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrders } from "@/lib/admin/orders";
import { searchParamsToRecord } from "@/lib/admin/search-params";
import { adminOrderListQuerySchema } from "@/lib/validations/order";

/**
 * GET /api/admin/orders?page=1&limit=20&status=PAID&paymentStatus=PAID&q=ORD-
 * Admin only. Lists every order (newest first) with customer email.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const parsed = adminOrderListQuerySchema.safeParse(
    searchParamsToRecord(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const { orders, pagination } = await getAdminOrders(parsed.data);
    return NextResponse.json(
      { data: orders, pagination },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
