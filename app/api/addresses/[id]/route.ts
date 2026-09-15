import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addressUpdateSchema } from "@/lib/validations/address";
import { deleteUserAddress, updateUserAddress } from "@/lib/account/addresses";

const idSchema = z.string().trim().min(1).max(64);

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/addresses/[id]
 * Signed-in users only. Partially updates an address the caller owns (404 otherwise).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid address id", issues: parsedId.error.issues },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addressUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await updateUserAddress(guard.userId, parsedId.data, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("[PATCH /api/addresses/[id]]", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

/**
 * DELETE /api/addresses/[id]
 * Signed-in users only. Deletes an address the caller owns (404 otherwise).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid address id", issues: parsedId.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await deleteUserAddress(guard.userId, parsedId.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("[DELETE /api/addresses/[id]]", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
