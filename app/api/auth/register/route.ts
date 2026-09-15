import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { registerUser } from "@/lib/users/register";
import { registerSchema } from "@/lib/validations/auth";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/**
 * POST /api/auth/register
 * Body: { name, email, password, confirmPassword }
 * Public. Creates a CUSTOMER account. Rate limited to 5 attempts per 10 minutes per IP.
 * Never returns the password hash.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`register:${getClientIp(request)}`, RATE_LIMIT);
  const headers = rateLimitHeaders(limit);

  if (!limit.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400, headers },
    );
  }

  try {
    const result = await registerUser(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409, headers },
      );
    }

    return NextResponse.json(
      { data: { id: result.userId, email: parsed.data.email } },
      { status: 201, headers },
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500, headers });
  }
}
