import { describe, expect, it } from "vitest";
import {
  attachRatings,
  formatReviewDate,
  pluralizeReviews,
  reviewerDisplayName,
  toProductRating,
} from "./format";

describe("toProductRating", () => {
  it("rounds the mean to one decimal place", () => {
    expect(toProductRating(4.75, 8)).toEqual({ average: 4.8, count: 8 });
    expect(toProductRating(4.6666, 3)).toEqual({ average: 4.7, count: 3 });
    expect(toProductRating(5, 1)).toEqual({ average: 5, count: 1 });
  });

  it("is unrated when there are no reviews, whatever the mean says", () => {
    expect(toProductRating(null, 0)).toEqual({ average: 0, count: 0 });
    expect(toProductRating(4.5, 0)).toEqual({ average: 0, count: 0 });
    expect(toProductRating(undefined, 0)).toEqual({ average: 0, count: 0 });
  });

  it("never returns a negative count or a non-finite mean", () => {
    expect(toProductRating(Number.NaN, 2)).toEqual({ average: 0, count: 2 });
    expect(toProductRating(4, -1)).toEqual({ average: 0, count: 0 });
  });
});

describe("attachRatings", () => {
  const products = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
  ];

  it("pairs each product with its aggregate and keeps the original fields", () => {
    const ratings = new Map([["a", { average: 4.8, count: 12 }]]);
    const result = attachRatings(products, ratings);

    expect(result[0]).toEqual({ id: "a", title: "A", rating: { average: 4.8, count: 12 } });
  });

  it("defaults products without reviews to unrated", () => {
    const result = attachRatings(products, new Map());
    expect(result[1]?.rating).toEqual({ average: 0, count: 0 });
    expect(result).toHaveLength(2);
  });

  it("does not mutate the input", () => {
    const input = [{ id: "a" }];
    attachRatings(input, new Map([["a", { average: 5, count: 1 }]]));
    expect(input[0]).toEqual({ id: "a" });
  });
});

describe("existing helpers", () => {
  it("pluralises review counts", () => {
    expect(pluralizeReviews(1)).toBe("1 review");
    expect(pluralizeReviews(12)).toBe("12 reviews");
  });

  it("falls back to Anonymous for blank names", () => {
    expect(reviewerDisplayName("  ")).toBe("Anonymous");
    expect(reviewerDisplayName("Sita")).toBe("Sita");
  });

  it("formats ISO dates and tolerates garbage", () => {
    expect(formatReviewDate("2026-09-10T12:00:00.000Z")).toBe("Sep 10, 2026");
    expect(formatReviewDate("nope")).toBe("");
  });
});
