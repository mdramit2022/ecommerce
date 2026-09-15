import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { authConfig } from "@/lib/auth.config";
import { signInSchema } from "@/lib/validations/auth";

/**
 * Full (Node runtime) Auth.js configuration: edge-safe base + Prisma adapter + providers.
 * Import `auth`, `signIn`, `signOut` from here in Server Components, Server Actions and Route Handlers.
 */
export const fullAuthConfig: NextAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }, // signInSchema already trims + lowercases
        });
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
      : []),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);

export type AdminGuardResult =
  { ok: true; userId: string } | { ok: false; status: 401 | 403; error: string };

/** Guard for admin-only Route Handlers. */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, error: "Authentication required" };
  if (session.user.role !== "ADMIN")
    return { ok: false, status: 403, error: "Admin access required" };
  return { ok: true, userId: session.user.id };
}

export type UserGuardResult =
  | { ok: true; userId: string; email: string | null | undefined }
  | { ok: false; status: 401; error: string };

/** Guard for Route Handlers that require any signed-in user. */
export async function requireUser(): Promise<UserGuardResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, error: "Authentication required" };
  return { ok: true, userId: session.user.id, email: session.user.email };
}
