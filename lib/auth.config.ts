import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * This file must NOT import Prisma, bcrypt, or anything Node-only: it is consumed by
 * `middleware.ts` (Edge runtime). `lib/auth.ts` spreads this config and adds the
 * Prisma adapter and providers for the Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [], // added in lib/auth.ts
  callbacks: {
    /**
     * Route protection for the matcher in middleware.ts.
     * - /account/**  -> any signed-in user
     * - /admin/**    -> ADMIN role only (others are sent to the home page)
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false; // redirects to /sign-in?callbackUrl=...
        if (auth?.user.role !== "ADMIN") {
          return Response.redirect(new URL("/?error=forbidden", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/account")) return isLoggedIn;

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
