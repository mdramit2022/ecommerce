"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userRoleUpdateSchema } from "@/lib/admin/customers";
import { formString } from "@/lib/admin/forms";
import { safeAdminReturnTo, withMessage } from "@/lib/admin/search-params";

const CUSTOMERS_PATH = "/admin/customers";

type Outcome = { kind: "notice" | "error"; message: string };

/**
 * Row action: promote a user to ADMIN or demote them to CUSTOMER.
 * Refuses to change the signed-in admin's own role so an admin can never lock themselves out.
 * The role lives in the JWT, so the affected user sees the change after their next sign-in.
 */
export async function setUserRole(formData: FormData): Promise<void> {
  const returnTo = safeAdminReturnTo(formData.get("returnTo"), CUSTOMERS_PATH);
  const guard = await requireAdmin();
  if (!guard.ok) return redirect(withMessage(returnTo, "error", guard.error));

  const parsed = userRoleUpdateSchema.safeParse({
    userId: formString(formData, "userId"),
    role: formString(formData, "role"),
  });
  if (!parsed.success) {
    return redirect(withMessage(returnTo, "error", "Invalid role change request."));
  }

  const { userId, role } = parsed.data;
  if (userId === guard.userId) {
    return redirect(
      withMessage(
        returnTo,
        "error",
        "You cannot change your own role. Ask another admin to do it.",
      ),
    );
  }

  let outcome: Outcome;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });
    if (!user) {
      outcome = { kind: "error", message: "User not found." };
    } else if (user.role === role) {
      outcome = { kind: "notice", message: `${user.email} is already ${role}.` };
    } else {
      await prisma.user.update({ where: { id: userId }, data: { role } });
      outcome = {
        kind: "notice",
        message: `${user.email} is now ${role === "ADMIN" ? "an admin" : "a customer"}. The change applies at their next sign-in.`,
      };
    }
  } catch (error) {
    console.error("[setUserRole]", error);
    outcome = { kind: "error", message: "Failed to update the user's role." };
  }

  if (outcome.kind === "notice") {
    revalidatePath(CUSTOMERS_PATH);
    revalidatePath("/admin");
  }
  redirect(withMessage(returnTo, outcome.kind, outcome.message));
}
