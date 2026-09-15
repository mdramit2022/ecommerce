import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton.
 * Next.js hot-reloads modules in development, which would otherwise create a new
 * PrismaClient (and connection pool) on every reload. We cache the instance on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
