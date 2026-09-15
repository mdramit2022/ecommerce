import { describe, expect, it } from "vitest";
import { toggleWishlistItem, type WishlistItem } from "./useWishlist";
import type { ProductCardData } from "@/types/product";

const product = (id: string, extra: Partial<ProductCardData> = {}): ProductCardData => ({
  id,
  title: `Product ${id}`,
  slug: `product-${id}`,
  price: 100,
  compareAtPrice: null,
  stock: 5,
  image: null,
  category: { name: "Cookware", slug: "cookware" },
  ...extra,
});

describe("toggleWishlistItem", () => {
  it("adds a product that is not saved yet", () => {
    const result = toggleWishlistItem([], product("a"));
    expect(result.saved).toBe(true);
    expect(result.items.map((item) => item.id)).toEqual(["a"]);
  });

  it("removes a product that is already saved", () => {
    const existing: WishlistItem[] = [product("a"), product("b")];
    const result = toggleWishlistItem(existing, product("a"));
    expect(result.saved).toBe(false);
    expect(result.items.map((item) => item.id)).toEqual(["b"]);
  });

  it("drops the rating snapshot but keeps everything the card needs", () => {
    const result = toggleWishlistItem([], product("a", { rating: { average: 4.8, count: 12 } }));
    expect(result.items[0]).not.toHaveProperty("rating");
    expect(result.items[0]).toMatchObject({
      id: "a",
      title: "Product a",
      slug: "product-a",
      price: 100,
      stock: 5,
      category: { name: "Cookware", slug: "cookware" },
    });
  });

  it("appends at the end and never mutates the input", () => {
    const existing: WishlistItem[] = [product("a")];
    const result = toggleWishlistItem(existing, product("b"));
    expect(result.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(existing).toHaveLength(1);
  });
});
