import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";
import { createUserAddress, listUserAddresses } from "@/lib/account/addresses";

/**
 * GET /api/addresses
 * Signed-in users only. Returns the caller's saved addresses (default first).
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const data = await listUserAddresses(guard.userId);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[GET /api/addresses]", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

/**
 * POST /api/addresses
 * Signed-in users only. Creates an address; `isDefault: true` clears the flag on the others.
 */
export async function POST(request: NextRequest) {
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

  const parsed = addressSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const data = await createUserAddress(guard.userId, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/addresses]", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}
