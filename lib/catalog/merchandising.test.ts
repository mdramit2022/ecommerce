import { describe, expect, it } from "vitest";
import {
  BEST_SELLER_BADGE,
  NEW_ARRIVAL_DAYS,
  NEW_BADGE,
  TRENDING_BADGE,
  bestSellerBadges,
  newArrivalBadges,
  rankBestSellers,
} from "./merchandising";

const NOW = new Date("2026-09-15T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

const item = (id: string, count: number, average: number, ageDays: number) => ({
  id,
  rating: { average, count },
  createdAt: daysAgo(ageDays),
});

describe("rankBestSellers", () => {
  it("orders by review count, then average, then recency", () => {
    const ranked = rankBestSellers([
      item("few-old", 2, 5, 100),
      item("many", 8, 4.5, 50),
      item("few-new", 2, 5, 10),
      item("few-lower", 2, 4, 5),
    ]);

    expect(ranked.map((p) => p.id)).toEqual(["many", "few-new", "few-old", "few-lower"]);
  });

  it("accepts ISO strings for createdAt and does not mutate the input", () => {
    const input = [
      { id: "a", rating: { average: 5, count: 1 }, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", rating: { average: 5, count: 1 }, createdAt: "2026-06-01T00:00:00.000Z" },
    ];
    const ranked = rankBestSellers(input);
    expect(ranked.map((p) => p.id)).toEqual(["b", "a"]);
    expect(input.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("bestSellerBadges", () => {
  it("badges the leader as Best Seller and the newest runner-up as Trending", () => {
    const ranked = [
      item("leader", 9, 4.8, 200),
      item("old", 5, 4.6, 150),
      item("fresh", 3, 4.7, 3),
    ];
    const badges = bestSellerBadges(ranked);

    expect(badges.get("leader")).toEqual(BEST_SELLER_BADGE);
    expect(badges.get("fresh")).toEqual(TRENDING_BADGE);
    expect(badges.has("old")).toBe(false);
  });

  it("never gives the leader both badges", () => {
    const badges = bestSellerBadges([item("only", 1, 5, 1)]);
    expect(badges.size).toBe(1);
    expect(badges.get("only")).toEqual(BEST_SELLER_BADGE);
  });

  it("is empty for an empty strip", () => {
    expect(bestSellerBadges([]).size).toBe(0);
  });
});

describe("newArrivalBadges", () => {
  it("marks products added within the window", () => {
    const badges = newArrivalBadges(
      [
        { id: "today", createdAt: daysAgo(0) },
        { id: "edge", createdAt: daysAgo(NEW_ARRIVAL_DAYS) },
        { id: "old", createdAt: daysAgo(NEW_ARRIVAL_DAYS + 1) },
      ],
      NOW,
    );

    expect(badges.get("today")).toEqual(NEW_BADGE);
    expect(badges.get("edge")).toEqual(NEW_BADGE);
    expect(badges.has("old")).toBe(false);
  });
});
