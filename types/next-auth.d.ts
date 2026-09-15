import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// `next-auth/jwt` only re-exports from `@auth/core/jwt`, so the JWT interface must be
// augmented at its declaring module for the merge to apply.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
