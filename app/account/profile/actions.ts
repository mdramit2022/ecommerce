"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { changePasswordSchema, profileSchema } from "@/lib/validations/user";
import { formValues, zodFieldErrors, type ActionState } from "@/lib/account/action-state";

const SIGN_IN = "/sign-in?callbackUrl=/account/profile";
const BCRYPT_ROUNDS = 12;

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Server Action for `useActionState`: update the display name. */
export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const values = formValues(formData, ["name"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
      select: { id: true },
    });
  } catch (error) {
    console.error("[updateProfile]", error);
    return { status: "error", message: "Could not update your profile. Please try again.", values };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return {
    status: "success",
    message: "Profile updated. Your new name appears after your next sign-in in some places.",
    values: { name: parsed.data.name },
  };
}

/**
 * Server Action for `useActionState`: change the password.
 * Verifies the current password with bcrypt; OAuth-only accounts (no passwordHash) get a clear message.
 */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const limit = rateLimit(`change-password:${userId}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.success) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a few minutes before trying again.",
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return { status: "error", message: "Account not found." };

    if (!user.passwordHash) {
      return {
        status: "error",
        message:
          "This account signs in with a social provider (e.g. Google) and has no password to change.",
      };
    }

    const valid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      };
    }

    const passwordHash = await hash(parsed.data.newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    });
  } catch (error) {
    console.error("[changePassword]", error);
    return { status: "error", message: "Could not change your password. Please try again." };
  }

  return { status: "success", message: "Password changed successfully." };
}
