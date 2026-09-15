import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AddressInput, AddressUpdateInput } from "@/lib/validations/address";

/**
 * Address data access shared by the account pages, Server Actions and /api/addresses.
 * Every query is scoped by `userId`, so a user can never read or mutate another user's rows.
 */

export const addressSelect = {
  id: true,
  fullName: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  phone: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AddressSelect;

export type AddressRow = Prisma.AddressGetPayload<{ select: typeof addressSelect }>;

/** Serialisable address shape (Dates as ISO strings). */
export type AddressData = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toAddressData(row: AddressRow): AddressData {
  return {
    id: row.id,
    fullName: row.fullName,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type AddressResult =
  { ok: true; data: AddressData } | { ok: false; code: "NOT_FOUND"; error: string };

const notFound: AddressResult = { ok: false, code: "NOT_FOUND", error: "Address not found" };

const addressOrder = [
  { isDefault: "desc" },
  { createdAt: "desc" },
] satisfies Prisma.AddressOrderByWithRelationInput[];

export async function listUserAddresses(userId: string): Promise<AddressData[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    select: addressSelect,
    orderBy: addressOrder,
  });
  return rows.map(toAddressData);
}

export async function getUserAddress(userId: string, id: string): Promise<AddressData | null> {
  const row = await prisma.address.findFirst({ where: { id, userId }, select: addressSelect });
  return row ? toAddressData(row) : null;
}

export function countUserAddresses(userId: string): Promise<number> {
  return prisma.address.count({ where: { userId } });
}

/** Creates an address. The first address a user saves always becomes the default. */
export async function createUserAddress(userId: string, input: AddressInput): Promise<AddressData> {
  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.address.count({ where: { userId } });
    const isDefault = existing === 0 || input.isDefault;

    if (isDefault && existing > 0) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state ?? null,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone ?? null,
        isDefault,
      },
      select: addressSelect,
    });
  });
  return toAddressData(row);
}

/** Partial update. `undefined` leaves a column untouched; `null` clears an optional one. */
export async function updateUserAddress(
  userId: string,
  id: string,
  input: AddressUpdateInput,
): Promise<AddressResult> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.address.findFirst({
      where: { id, userId },
      select: { id: true, isDefault: true },
    });
    if (!current) return notFound;

    // Un-defaulting is only possible by promoting another address, so a user always keeps one default.
    const makeDefault = input.isDefault === true && !current.isDefault;
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const row = await tx.address.update({
      where: { id },
      data: {
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone,
        ...(makeDefault ? { isDefault: true } : {}),
      },
      select: addressSelect,
    });
    return { ok: true, data: toAddressData(row) };
  });
}

export async function setDefaultUserAddress(userId: string, id: string): Promise<AddressResult> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.address.findFirst({ where: { id, userId }, select: { id: true } });
    if (!current) return notFound;

    await tx.address.updateMany({
      where: { userId, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
    const row = await tx.address.update({
      where: { id },
      data: { isDefault: true },
      select: addressSelect,
    });
    return { ok: true, data: toAddressData(row) };
  });
}

/** Deletes an address. If it was the default, the most recently added remaining address is promoted. */
export async function deleteUserAddress(userId: string, id: string): Promise<AddressResult> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.address.findFirst({ where: { id, userId }, select: addressSelect });
    if (!current) return notFound;

    await tx.address.delete({ where: { id } });

    if (current.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
    return { ok: true, data: toAddressData(current) };
  });
}
