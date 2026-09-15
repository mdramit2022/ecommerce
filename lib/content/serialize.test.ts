import { describe, expect, it } from "vitest";
import { groupFooterLinks } from "./serialize";
import type { SiteContentItemData } from "@/types/content";

const link = (
  group: string | null,
  title: string,
  sortOrder: number,
  href = "/shop",
): SiteContentItemData => ({
  id: `${group}-${title}`,
  kind: "FOOTER_LINK",
  group,
  title,
  subtitle: null,
  href,
  icon: null,
  sortOrder,
  isActive: true,
  updatedAt: "2026-09-15T00:00:00.000Z",
});

describe("groupFooterLinks", () => {
  it("groups links under their heading in first-seen order after sorting", () => {
    const columns = groupFooterLinks([
      link("Store", "About Us", 30),
      link("Shop", "Offers", 3),
      link("Shop", "All Products", 0),
      link("Categories", "Cookware", 10),
    ]);

    expect(columns.map((c) => c.heading)).toEqual(["Shop", "Categories", "Store"]);
    expect(columns[0]?.links.map((l) => l.title)).toEqual(["All Products", "Offers"]);
  });

  it("breaks sortOrder ties alphabetically and skips links without a heading", () => {
    const columns = groupFooterLinks([
      link("Shop", "Zeta", 1),
      link("Shop", "Alpha", 1),
      link(null, "Orphan", 0),
      link("  ", "Blank", 0),
    ]);

    expect(columns).toHaveLength(1);
    expect(columns[0]?.links.map((l) => l.title)).toEqual(["Alpha", "Zeta"]);
  });

  it("returns an empty list for no links and does not mutate the input", () => {
    const input = [link("Shop", "B", 2), link("Shop", "A", 1)];
    expect(groupFooterLinks([])).toEqual([]);
    groupFooterLinks(input);
    expect(input.map((l) => l.title)).toEqual(["B", "A"]);
  });
});
