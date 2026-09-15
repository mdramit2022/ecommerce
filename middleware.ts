import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Edge middleware: enforces the `authorized` callback in lib/auth.config.ts
 * for the routes below. Uses the edge-safe config (no Prisma / bcrypt).
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
