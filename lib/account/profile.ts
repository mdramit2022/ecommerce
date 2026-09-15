import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

/** Public, serialisable profile shape (returned by GET /api/me). */
export type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
};

export function toProfileData(row: ProfileRow): ProfileData {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Profile plus whether the account has a password (false for OAuth-only users). */
export async function getProfile(
  userId: string,
): Promise<(ProfileData & { hasPassword: boolean }) | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...profileSelect, passwordHash: true },
  });
  if (!row) return null;
  const { passwordHash, ...rest } = row;
  return { ...toProfileData(rest), hasPassword: passwordHash !== null };
}
