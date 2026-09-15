/**
 * Serialisable cart shapes shared by `/api/cart`, the Zustand cart store and the cart UI.
 * Prices are plain numbers (2 dp) - Prisma `Decimal` never crosses to the client.
 */

export type CartItemData = {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  quantity: number;
};

export type CartData = {
  items: CartItemData[];
  subtotal: number;
};

/** Body of GET/PUT/DELETE `/api/cart` on success. */
export type CartResponse = { data: CartData };

/** One line of the PUT `/api/cart` body. Only ids and quantities are trusted from the client. */
export type CartReplaceItem = { productId: string; quantity: number };
export type CartReplaceBody = { items: CartReplaceItem[] };

/** Generic error body used by every Route Handler. */
export type ApiErrorBody = { error: string; issues?: unknown[] };

// ───────────── POST /api/checkout responses the cart UI reacts to ─────────────

/**
 * 201 - the order exists. Card payments also return `url` (Stripe Checkout); manual methods
 * (cash on delivery, eSewa, IME Pay, bank transfer) return the order number instead.
 * `redirectTo` is where the browser should go next either way.
 */
export type CheckoutStartBody = {
  data: {
    orderId: string;
    orderNumber?: string;
    paymentMethod: string;
    url?: string;
    redirectTo: string;
  };
};

/** 409 - one or more lines exceed the available stock. */
export type CheckoutStockIssue = { productId: string; title?: string; available: number };
export type CheckoutStockConflictBody = { error: string; items: CheckoutStockIssue[] };

/** 400 - products that no longer exist or are inactive. */
export type CheckoutUnavailableBody = { error: string; productIds?: string[] };
