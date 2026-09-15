import { describe, expect, it } from "vitest";
import { productCardSelect, toProductCardData } from "./serializers";
import { decimal, makeProductCardRow } from "@/tests/helpers/rows";

describe("productCardSelect", () => {
  it("selects exactly the columns the card needs", () => {
    expect(Object.keys(productCardSelect).sort()).toEqual(
      ["category", "compareAtPrice", "id", "images", "price", "slug", "stock", "title"].sort(),
    );
  });

  it("only pulls name and slug from the category relation", () => {
    expect(productCardSelect.category).toEqual({ select: { name: true, slug: true } });
  });
});

describe("toProductCardData", () => {
  it("converts Decimal money to plain numbers", () => {
    const result = toProductCardData(
      makeProductCardRow({ price: decimal("24.00"), compareAtPrice: decimal("32.50") }),
    );

    expect(result.price).toBe(24);
    expect(result.compareAtPrice).toBe(32.5);
    expect(typeof result.price).toBe("number");
    expect(typeof result.compareAtPrice).toBe("number");
  });

  it.each([
    ["19.99", 19.99],
    ["0.01", 0.01],
    ["1234.56", 1234.56],
    ["99999999.99", 99999999.99],
    ["0", 0],
  ])("preserves the price %s exactly as %s", (raw, expected) => {
    expect(toProductCardData(makeProductCardRow({ price: decimal(raw) })).price).toBe(expected);
  });

  it("maps a null compareAtPrice to null", () => {
    expect(
      toProductCardData(makeProductCardRow({ compareAtPrice: null })).compareAtPrice,
    ).toBeNull();
  });

  it("uses the first image", () => {
    const result = toProductCardData(
      makeProductCardRow({
        images: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
      }),
    );
    expect(result.image).toBe("https://cdn.example.com/a.jpg");
  });

  it("returns null when the product has no images", () => {
    expect(toProductCardData(makeProductCardRow({ images: [] })).image).toBeNull();
  });

  it("passes identity, stock and category through unchanged", () => {
    const result = toProductCardData(
      makeProductCardRow({
        id: "prod_42",
        title: "Merino Crew Sweater",
        slug: "merino-crew-sweater",
        stock: 0,
        category: { name: "Knitwear", slug: "knitwear" },
      }),
    );

    expect(result).toMatchObject({
      id: "prod_42",
      title: "Merino Crew Sweater",
      slug: "merino-crew-sweater",
      stock: 0,
      category: { name: "Knitwear", slug: "knitwear" },
    });
  });

  it("produces exactly the ProductCardData keys (no raw images array leaks through)", () => {
    const result = toProductCardData(makeProductCardRow());

    expect(Object.keys(result).sort()).toEqual(
      ["category", "compareAtPrice", "id", "image", "price", "slug", "stock", "title"].sort(),
    );
    expect(result).not.toHaveProperty("images");
  });

  it("is JSON-serialisable (safe to pass to Client Components)", () => {
    const result = toProductCardData(makeProductCardRow());
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
