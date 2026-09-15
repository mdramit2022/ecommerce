import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productCardSelect, toProductCardData } from "@/lib/serializers";
import { CART_MAX_LINE_QUANTITY, type CartReplaceInput } from "@/lib/validations/cart";
import type { CartData, CartItemData } from "@/types/cart";

/**
 * Server-side cart persistence for signed-in users (server only - imports Prisma).
 * Used by `/api/cart`; the client keeps its own copy in the Zustand store and syncs via `CartSync`.
 */

export const cartItemSelect = {
  productId: true,
  quantity: true,
  product: { select: { ...productCardSelect, isActive: true } },
} satisfies Prisma.CartItemSelect;

export type CartItemRow = Prisma.CartItemGetPayload<{ select: typeof cartItemSelect }>;

const EMPTY_CART: CartData = { items: [], subtotal: 0 };

/**
 * Lines whose product was deactivated or sold out are dropped; quantities are clamped to stock.
 * Returns the serialisable cart plus a Decimal-exact subtotal (as number).
 */
export function toCartData(rows: CartItemRow[]): CartData {
  const items: CartItemData[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const row of rows) {
    if (!row.product.isActive || row.product.stock <= 0) continue;

    const product = toProductCardData(row.product);
    const quantity = Math.min(row.quantity, product.stock, CART_MAX_LINE_QUANTITY);
    if (quantity < 1) continue;

    subtotal = subtotal.add(row.product.price.mul(quantity));
    items.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity,
    });
  }

  return { items, subtotal: subtotal.toDecimalPlaces(2).toNumber() };
}

/** Find the user's cart or create an empty one. Safe under concurrent first-time syncs. */
export async function getOrCreateCart(userId: string): Promise<{ id: string }> {
  try {
    return await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });
  } catch (error) {
    // Two parallel requests can both miss and race on the unique `userId`; the loser re-reads.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
      if (existing) return existing;
    }
    throw error;
  }
}

/** Current cart contents joined with live product data. Missing cart -> empty cart. */
export async function getCartItems(userId: string): Promise<CartData> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: { select: cartItemSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!cart) return EMPTY_CART;
  return toCartData(cart.items);
}

/**
 * Replace the whole cart with `items`.
 * - Duplicate product ids are collapsed (highest quantity wins).
 * - Unknown or inactive products are dropped rather than rejected, so a sync never gets stuck
 *   on a product that was retired after it was added.
 * - Quantities are clamped to stock; sold-out lines are dropped.
 * Returns the canonical cart as stored.
 */
export async function replaceCart(
  userId: string,
  items: CartReplaceInput["items"],
): Promise<CartData> {
  const cart = await getOrCreateCart(userId);

  const requested = new Map<string, number>();
  for (const item of items) {
    const previous = requested.get(item.productId) ?? 0;
    requested.set(
      item.productId,
      Math.min(Math.max(previous, item.quantity), CART_MAX_LINE_QUANTITY),
    );
  }
  const productIds = [...requested.keys()];

  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true, stock: true },
        })
      : [];

  // Preserve the client's line order so a fresh device sees the same cart layout.
  const order = new Map(productIds.map((id, index) => [id, index]));
  const rows: Prisma.CartItemCreateManyInput[] = products
    .map((product) => ({
      cartId: cart.id,
      productId: product.id,
      quantity: Math.min(requested.get(product.id) ?? 0, product.stock),
    }))
    .filter((row) => row.quantity >= 1)
    .sort((a, b) => (order.get(a.productId) ?? 0) - (order.get(b.productId) ?? 0));

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cartItem.createMany({ data: rows }),
    prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } }),
  ]);

  return getCartItems(userId);
}

/** Remove every line from the user's cart (the Cart row itself is kept). */
export async function clearCart(userId: string): Promise<CartData> {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  return EMPTY_CART;
}
