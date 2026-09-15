"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductCardData } from "@/types/product";

export type CartLine = {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  /** Add a product (or increase quantity). Quantity is clamped to available stock. */
  addItem: (product: ProductCardData, quantity?: number) => void;
  removeItem: (productId: string) => void;
  /** Set an absolute quantity; 0 removes the line. */
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  /** Record fresh stock for a line (e.g. from a checkout 409) and clamp its quantity; 0 removes it. */
  setStock: (productId: string, stock: number) => void;
  /** Replace every line (used to adopt the server's canonical cart). */
  setItems: (lines: readonly CartLine[]) => void;
  /**
   * Merge lines from another source (e.g. the server cart). Local lines are kept; for a product
   * present in both, the higher quantity wins and the incoming line's product data (price, stock,
   * title) is treated as fresher. Quantities are clamped to the incoming stock; sold-out lines drop.
   */
  mergeItems: (lines: readonly CartLine[]) => void;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Pure merge used by `mergeItems` - exported so it can be unit-tested without the store. */
export function mergeCartLines(
  existing: readonly CartLine[],
  incoming: readonly CartLine[],
): CartLine[] {
  const byId = new Map<string, CartLine>(existing.map((line) => [line.productId, line]));

  for (const line of incoming) {
    const current = byId.get(line.productId);
    if (line.stock <= 0) {
      byId.delete(line.productId);
      continue;
    }
    const quantity = Math.max(current?.quantity ?? 0, line.quantity);
    byId.set(line.productId, { ...line, quantity: clamp(quantity, 1, line.stock) });
  }

  return [...byId.values()];
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((line) => line.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((line) =>
                line.productId === product.id
                  ? { ...line, quantity: clamp(line.quantity + quantity, 1, product.stock) }
                  : line,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                image: product.image,
                stock: product.stock,
                quantity: clamp(quantity, 1, product.stock),
              },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((line) => line.productId !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => line.productId !== productId)
              : state.items.map((line) =>
                  line.productId === productId
                    ? { ...line, quantity: clamp(quantity, 1, line.stock) }
                    : line,
                ),
        })),

      clearCart: () => set({ items: [] }),

      setStock: (productId, stock) =>
        set((state) => ({
          items:
            stock <= 0
              ? state.items.filter((line) => line.productId !== productId)
              : state.items.map((line) =>
                  line.productId === productId
                    ? { ...line, stock, quantity: clamp(line.quantity, 1, stock) }
                    : line,
                ),
        })),

      setItems: (lines) => set({ items: [...lines] }),

      mergeItems: (lines) => set((state) => ({ items: mergeCartLines(state.items, lines) })),
    }),
    {
      name: "cart-storage",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// ───────────── Derived selectors (use with `useCart(selector)`) ─────────────

export const selectItemCount = (state: CartState): number =>
  state.items.reduce((sum, line) => sum + line.quantity, 0);

export const selectSubtotal = (state: CartState): number =>
  Math.round(state.items.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100;
