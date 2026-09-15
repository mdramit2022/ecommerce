"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";
import {
  createUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
  updateUserAddress,
} from "@/lib/account/addresses";
import { formValues, zodFieldErrors, type ActionState } from "@/lib/account/action-state";

const ADDRESS_FIELDS = [
  "fullName",
  "line1",
  "line2",
  "city",
  "state",
  "postalCode",
  "country",
  "phone",
  "isDefault",
] as const;

const idSchema = z.string().trim().min(1).max(64);

const SIGN_IN = "/sign-in?callbackUrl=/account/addresses";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parseAddressForm(formData: FormData) {
  const values = formValues(formData, ADDRESS_FIELDS);
  const parsed = addressSchema.safeParse({
    ...values,
    isDefault: formData.get("isDefault") === "on",
  });
  return { values, parsed };
}

function revalidateAddresses() {
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}

/** Server Action for `useActionState`: create an address for the signed-in user. */
export async function createAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const { values, parsed } = parseAddressForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await createUserAddress(userId, parsed.data);
  } catch (error) {
    console.error("[createAddress]", error);
    return { status: "error", message: "Could not save the address. Please try again.", values };
  }

  revalidateAddresses();
  redirect("/account/addresses");
}

/** Server Action for `useActionState` (bind the address id first): update an address the user owns. */
export async function updateAddress(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { status: "error", message: "Address not found." };

  const { values, parsed } = parseAddressForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const result = await updateUserAddress(userId, parsedId.data, parsed.data);
    if (!result.ok) return { status: "error", message: result.error, values };
  } catch (error) {
    console.error("[updateAddress]", error);
    return { status: "error", message: "Could not update the address. Please try again.", values };
  }

  revalidateAddresses();
  redirect("/account/addresses");
}

/** Server Action: remove an address the user owns. */
export async function deleteAddress(id: string): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { status: "error", message: "Address not found." };

  try {
    const result = await deleteUserAddress(userId, parsedId.data);
    if (!result.ok) return { status: "error", message: result.error };
  } catch (error) {
    console.error("[deleteAddress]", error);
    return { status: "error", message: "Could not delete the address. Please try again." };
  }

  revalidateAddresses();
  return { status: "success", message: "Address deleted." };
}

/** Server Action: mark one address as default and clear the flag on the others (transactional). */
export async function setDefaultAddress(id: string): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect(SIGN_IN);

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { status: "error", message: "Address not found." };

  try {
    const result = await setDefaultUserAddress(userId, parsedId.data);
    if (!result.ok) return { status: "error", message: result.error };
  } catch (error) {
    console.error("[setDefaultAddress]", error);
    return { status: "error", message: "Could not update the default address. Please try again." };
  }

  revalidateAddresses();
  return { status: "success", message: "Default address updated." };
}
