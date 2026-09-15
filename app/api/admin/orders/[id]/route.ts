import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminOrderDetail,
  transitionOrderStatus,
  updateOrderPaymentStatus,
} from "@/lib/admin/orders";
import { adminOrderUpdateSchema } from "@/lib/validations/order";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/orders/[id]
 * Admin only. Full order detail (items, customer, Stripe ids, shipping address).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  try {
    const order = await getAdminOrderDetail(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(
      { data: order },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/admin/orders/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Admin only. Body is either
 *   { status: OrderStatus, markRefunded?: boolean }            - move the order along, or
 *   { paymentStatus: PaymentStatus, paymentReference?: string } - record a manual payment
 *     (cash on delivery, eSewa, IME Pay, bank transfer; Stripe orders are refused with 409).
 * Only transitions allowed by lib/orders/status.ts are accepted (409 otherwise).
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

  const parsed = adminOrderUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const result =
      "paymentStatus" in input
        ? await updateOrderPaymentStatus(id, input)
        : await transitionOrderStatus(id, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${id}`);

    return NextResponse.json({ data: result.order });
  } catch (error) {
    console.error("[PATCH /api/admin/orders/[id]]", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
