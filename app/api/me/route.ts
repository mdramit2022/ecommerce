import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/user";
import { profileSelect, toProfileData } from "@/lib/account/profile";

/**
 * GET /api/me
 * Signed-in users only. Returns the caller's profile: { id, name, email, role, createdAt }.
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: guard.userId },
      select: profileSelect,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { data: toProfileData(user) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/me]", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/me
 * Signed-in users only. Body: { name }. Updates the caller's display name.
 */
export async function PATCH(request: NextRequest) {
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

  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: guard.userId },
      data: { name: parsed.data.name },
      select: profileSelect,
    });
    return NextResponse.json({ data: toProfileData(user) });
  } catch (error) {
    console.error("[PATCH /api/me]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
