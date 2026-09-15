import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, formatPrice, generateOrderNumber, percentOff, slugify } from "./utils";

const NBSP = " ";
/** Same rule as `productCreateSchema.slug`; slugify output must always satisfy it (or be empty). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("cn", () => {
  it("joins class names with a single space", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, 0, "", "b")).toBe("a b");
  });

  it("supports array and object syntax", () => {
    expect(cn(["a", { b: true, c: false }], { d: true })).toBe("a b d");
  });

  it("resolves conflicting Tailwind utilities so the last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("bg-white", undefined, "bg-neutral-900")).toBe("bg-neutral-900");
    expect(cn("text-sm text-neutral-500", "text-lg")).toBe("text-neutral-500 text-lg");
  });

  it("keeps non-conflicting utilities", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
    expect(cn("rounded-lg", "border", "border-neutral-300")).toBe(
      "rounded-lg border border-neutral-300",
    );
  });

  it("returns an empty string without input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatPrice", () => {
  it.each([
    [3250, "Rs. 3,250"],
    [850, "Rs. 850"],
    [0, "Rs. 0"],
    [1234.5, "Rs. 1,234.50"],
    [0.5, "Rs. 0.50"],
    [19.999, "Rs. 20"],
    [1_000_000, "Rs. 1,000,000"],
  ])("formats %s as %s (rupees by default)", (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected);
  });

  it("shows paisa only when there are any", () => {
    expect(formatPrice(1450)).toBe("Rs. 1,450");
    expect(formatPrice(1450.25)).toBe("Rs. 1,450.25");
    expect(formatPrice(1450.004)).toBe("Rs. 1,450");
  });

  it("formats negative rupee amounts with a leading sign", () => {
    expect(formatPrice(-5)).toBe("-Rs. 5");
    expect(formatPrice(-0.001)).toBe("Rs. 0");
  });

  it('accepts lowercase ISO codes (orders store currency as "npr")', () => {
    expect(formatPrice(3250, "npr")).toBe("Rs. 3,250");
  });

  it.each([
    [1234.5, "$1,234.50"],
    [0, "$0.00"],
    [-5, "-$5.00"],
    [19.999, "$20.00"],
  ])("still formats historic USD orders as %s -> %s", (amount, expected) => {
    expect(formatPrice(amount, "USD")).toBe(expected);
    expect(formatPrice(amount, "usd")).toBe(expected);
  });

  it("formats other currencies through Intl", () => {
    expect(formatPrice(10, "EUR")).toBe("€10.00");
    expect(formatPrice(10, "GBP", "en-GB")).toBe("£10.00");
    expect(formatPrice(1234, "JPY")).toBe("¥1,234");
  });

  it("respects the locale for Intl currencies", () => {
    expect(formatPrice(10, "EUR", "de-DE")).toBe(`10,00${NBSP}€`);
  });
});

describe("percentOff", () => {
  it.each([
    [3250, 3950, 18],
    [1450, 1850, 22],
    [1200, 1500, 20],
    [850, 1100, 23],
    [1350, 1700, 21],
  ])("rounds %s vs %s to %s%%", (price, compareAt, expected) => {
    expect(percentOff(price, compareAt)).toBe(expected);
  });

  it("is 0 when there is no discount", () => {
    expect(percentOff(100, null)).toBe(0);
    expect(percentOff(100, undefined)).toBe(0);
    expect(percentOff(100, 100)).toBe(0);
    expect(percentOff(100, 90)).toBe(0);
    expect(percentOff(100, 0)).toBe(0);
  });
});

describe("slugify", () => {
  it.each([
    ["Hello World", "hello-world"],
    ["  Leading and trailing  ", "leading-and-trailing"],
    ["Multiple   spaces", "multiple-spaces"],
    ["tabs\tand\nnewlines", "tabs-and-newlines"],
    ["already-a-slug", "already-a-slug"],
    ["--dashes--everywhere--", "dashes-everywhere"],
    ["UPPER CASE", "upper-case"],
    ["Wireless Noise-Cancelling Headphones", "wireless-noise-cancelling-headphones"],
    ["50% Off (Today Only)", "50-off-today-only"],
    ["Café & Crème!", "caf-crme"],
    ["emoji 🎉 party", "emoji-party"],
    ["a.b.c", "abc"],
    ["123", "123"],
    ["", ""],
    ["   ", ""],
    ["!!!", ""],
    ["---", ""],
  ])("slugify(%j) -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("converts underscores to hyphens", () => {
    expect(slugify("snake_case_name")).toBe("snake-case-name");
  });

  it("is idempotent", () => {
    const inputs = ["Hello World", "Café & Crème!", "--x--", "snake_case", "Already-Fine"];
    for (const input of inputs) {
      const once = slugify(input);
      expect(slugify(once)).toBe(once);
    }
  });

  it("always produces a value that satisfies the product slug rule (or is empty)", () => {
    const inputs = [
      "Hello World",
      "  spaces  ",
      "UPPER",
      "50% Off (Today Only)",
      "a_b_c",
      "--x--",
      "ünïcödé",
      "!!!",
    ];
    for (const input of inputs) {
      const slug = slugify(input);
      expect(slug === "" || SLUG_PATTERN.test(slug)).toBe(true);
    }
  });
});

describe("generateOrderNumber", () => {
  const ORDER_NUMBER = /^ORD-\d{8}-[A-Z0-9]{1,6}$/;

  it("matches ORD-YYYYMMDD-XXXXXX", () => {
    expect(generateOrderNumber()).toMatch(ORDER_NUMBER);
  });

  it("uses the UTC calendar date of the given Date", () => {
    expect(generateOrderNumber(new Date("2026-09-10T23:59:59.999Z"))).toMatch(/^ORD-20260910-/);
    expect(generateOrderNumber(new Date("2026-01-01T00:00:00.000Z"))).toMatch(/^ORD-20260101-/);
  });

  it("defaults to the current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-05-06T12:00:00.000Z"));
    expect(generateOrderNumber()).toMatch(/^ORD-20300506-/);
  });

  it("derives the suffix from Math.random (base36, upper-cased)", () => {
    // (0.123456789).toString(36) === "0.4fzzzxjylrx"
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);
    expect(generateOrderNumber(new Date("2026-09-10T00:00:00.000Z"))).toBe("ORD-20260910-4FZZZX");
  });

  it("produces different suffixes across calls", () => {
    const numbers = new Set(Array.from({ length: 25 }, () => generateOrderNumber()));
    expect(numbers.size).toBeGreaterThan(1);
  });
});
