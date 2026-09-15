import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { clearCart, getCartItems, replaceCart } from "@/lib/cart/server";
import { cartReplaceSchema } from "@/lib/validations/cart";
import type { CartResponse } from "@/types/cart";

/**
 * Server-side cart for signed-in users. Guests keep their cart in `localStorage` only.
 * Responses are per-user and must never be cached by a shared cache.
 */
const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * GET /api/cart
 * Returns the current user's cart joined with live product data (inactive/sold-out lines dropped).
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body: CartResponse = { data: await getCartItems(guard.userId) };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("[GET /api/cart]", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

/**
 * PUT /api/cart
 * Body: { items: [{ productId, quantity }] } - replaces the whole cart.
 * Prices come from the DB; quantities are clamped to stock; unknown products are dropped.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = cartReplaceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const body: CartResponse = { data: await replaceCart(guard.userId, parsed.data.items) };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("[PUT /api/cart]", error);
    return NextResponse.json({ error: "Failed to save cart" }, { status: 500 });
  }
}

/**
 * DELETE /api/cart
 * Removes every line from the current user's cart.
 */
export async function DELETE() {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body: CartResponse = { data: await clearCart(guard.userId) };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
