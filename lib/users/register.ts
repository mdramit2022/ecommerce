import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult = { ok: true; userId: string } | { ok: false; code: "EMAIL_TAKEN" };

const BCRYPT_ROUNDS = 12;

/**
 * Creates a CUSTOMER account with a bcrypt password hash.
 * The email is normalised to lowercase; a concurrent insert of the same email (P2002)
 * is reported as EMAIL_TAKEN rather than thrown.
 */
export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, code: "EMAIL_TAKEN" };

  const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
      select: { id: true },
    });
    return { ok: true, userId: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: "EMAIL_TAKEN" };
    }
    throw error;
  }
}
