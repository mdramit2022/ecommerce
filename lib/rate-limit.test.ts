import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIp, rateLimit, rateLimitHeaders } from "./rate-limit";
import { makeRequest } from "@/tests/helpers/request";

/** The limiter keeps module-level state; give every test its own key so they cannot interfere. */
let keyCounter = 0;
const uniqueKey = (label: string): string => `test:${label}:${++keyCounter}`;

const START = new Date("2026-09-10T12:00:00.000Z");

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request and opens a window", () => {
    const result = rateLimit(uniqueKey("first"), { limit: 5, windowMs: 60_000 });

    expect(result).toEqual({
      success: true,
      limit: 5,
      remaining: 4,
      resetAt: START.getTime() + 60_000,
    });
  });

  it("counts remaining down and blocks once the limit is exceeded", () => {
    const key = uniqueKey("exhaust");
    const options = { limit: 3, windowMs: 60_000 };

    const results = Array.from({ length: 5 }, () => rateLimit(key, options));

    expect(results.map((r) => r.success)).toEqual([true, true, true, false, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0]);
    // The reset time is fixed for the lifetime of the window.
    expect(new Set(results.map((r) => r.resetAt)).size).toBe(1);
    expect(results.every((r) => r.limit === 3)).toBe(true);
  });

  it("never reports negative remaining", () => {
    const key = uniqueKey("negative");
    for (let i = 0; i < 10; i += 1) {
      expect(rateLimit(key, { limit: 2, windowMs: 1_000 }).remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps blocking while the window is still open", () => {
    const key = uniqueKey("still-open");
    const options = { limit: 1, windowMs: 10_000 };

    expect(rateLimit(key, options).success).toBe(true);
    vi.advanceTimersByTime(9_999);
    const blocked = rateLimit(key, options);

    expect(blocked.success).toBe(false);
    expect(blocked.resetAt).toBe(START.getTime() + 10_000);
  });

  it("starts a fresh window once resetAt is reached (boundary inclusive)", () => {
    const key = uniqueKey("reset");
    const options = { limit: 2, windowMs: 10_000 };

    rateLimit(key, options);
    rateLimit(key, options);
    expect(rateLimit(key, options).success).toBe(false);

    vi.advanceTimersByTime(10_000);
    const fresh = rateLimit(key, options);

    expect(fresh).toEqual({
      success: true,
      limit: 2,
      remaining: 1,
      resetAt: START.getTime() + 20_000,
    });
  });

  it("tracks keys independently", () => {
    const a = uniqueKey("a");
    const b = uniqueKey("b");
    const options = { limit: 1, windowMs: 60_000 };

    expect(rateLimit(a, options).success).toBe(true);
    expect(rateLimit(a, options).success).toBe(false);
    expect(rateLimit(b, options).success).toBe(true);
  });

  it("uses the window length supplied on the first request of a window", () => {
    const key = uniqueKey("window-length");

    expect(rateLimit(key, { limit: 10, windowMs: 1_500 }).resetAt).toBe(START.getTime() + 1_500);
    // A different windowMs on a later call does not move the existing window.
    expect(rateLimit(key, { limit: 10, windowMs: 99_000 }).resetAt).toBe(START.getTime() + 1_500);
  });
});

describe("getClientIp", () => {
  it.each<[string, Record<string, string>, string]>([
    ["reads a single x-forwarded-for value", { "x-forwarded-for": "203.0.113.5" }, "203.0.113.5"],
    [
      "uses the left-most (client) address of a proxy chain",
      { "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" },
      "203.0.113.5",
    ],
    [
      "trims surrounding whitespace",
      { "x-forwarded-for": "  203.0.113.5  ,10.0.0.1" },
      "203.0.113.5",
    ],
    [
      "prefers x-forwarded-for over x-real-ip",
      { "x-forwarded-for": "203.0.113.5", "x-real-ip": "198.51.100.7" },
      "203.0.113.5",
    ],
    ["falls back to x-real-ip", { "x-real-ip": "198.51.100.7" }, "198.51.100.7"],
    [
      "falls back to x-real-ip when x-forwarded-for is empty",
      { "x-forwarded-for": "", "x-real-ip": "198.51.100.7" },
      "198.51.100.7",
    ],
    [
      "falls back to x-real-ip when the first forwarded entry is blank",
      { "x-forwarded-for": " , 10.0.0.1", "x-real-ip": "198.51.100.7" },
      "198.51.100.7",
    ],
    ["supports IPv6 addresses", { "x-forwarded-for": "2001:db8::1" }, "2001:db8::1"],
    ['returns "unknown" without any proxy headers', {}, "unknown"],
  ])("%s", (_label, headers, expected) => {
    expect(getClientIp(makeRequest(headers))).toBe(expected);
  });

  it("matches header names case-insensitively", () => {
    expect(getClientIp(makeRequest({ "X-Forwarded-For": "203.0.113.9" }))).toBe("203.0.113.9");
  });
});

describe("rateLimitHeaders", () => {
  it("serialises every field as a string", () => {
    const headers = rateLimitHeaders({
      success: false,
      limit: 10,
      remaining: 0,
      resetAt: 1_757_505_600_000,
    });

    expect(headers).toEqual({
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1757505600",
    });
    expect(Object.values(headers).every((v) => typeof v === "string")).toBe(true);
  });

  it("rounds the reset timestamp up to whole seconds", () => {
    const base = { success: true, limit: 1, remaining: 0 };
    expect(rateLimitHeaders({ ...base, resetAt: 1_000_001 })["X-RateLimit-Reset"]).toBe("1001");
    expect(rateLimitHeaders({ ...base, resetAt: 1_000_000 })["X-RateLimit-Reset"]).toBe("1000");
  });

  it("round-trips a live limiter result", () => {
    const result = rateLimit(uniqueKey("headers"), { limit: 7, windowMs: 30_000 });
    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("7");
    expect(headers["X-RateLimit-Remaining"]).toBe("6");
    expect(headers["X-RateLimit-Reset"]).toBe(String(Math.ceil(result.resetAt / 1000)));
  });
});
