import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";

/** Body accepted by PATCH /api/me and the update-profile Server Action. */
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Body accepted by the change-password Server Action. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
