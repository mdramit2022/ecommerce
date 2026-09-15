import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHIPPING_COUNTRY,
  SHIPPING_COUNTRIES,
  SHIPPING_COUNTRY_CODES,
  countryName,
  isSupportedShippingCountry,
} from "./countries";

describe("SHIPPING_COUNTRIES", () => {
  it("uses unique, upper-case, 2-letter ISO codes", () => {
    for (const country of SHIPPING_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.length).toBeGreaterThan(1);
    }
    expect(new Set(SHIPPING_COUNTRY_CODES).size).toBe(SHIPPING_COUNTRY_CODES.length);
  });

  it("exposes the codes in list order", () => {
    expect(SHIPPING_COUNTRY_CODES).toEqual(SHIPPING_COUNTRIES.map((country) => country.code));
  });

  it("offers a default that is actually on the list", () => {
    expect(SHIPPING_COUNTRY_CODES).toContain(DEFAULT_SHIPPING_COUNTRY);
  });
});

describe("countryName", () => {
  it("resolves a supported code", () => {
    expect(countryName("NP")).toBe("Nepal");
    expect(countryName("US")).toBe("United States");
  });

  it("accepts lower case and surrounding whitespace", () => {
    expect(countryName(" np ")).toBe("Nepal");
  });

  it("falls back to the raw code for anything unknown", () => {
    expect(countryName("ZZ")).toBe("ZZ");
    expect(countryName("")).toBe("");
  });
});

describe("isSupportedShippingCountry", () => {
  it.each(["NP", "np", " IN "])("accepts %j", (code) => {
    expect(isSupportedShippingCountry(code)).toBe(true);
  });

  it.each(["ZZ", "", "NPL"])("rejects %j", (code) => {
    expect(isSupportedShippingCountry(code)).toBe(false);
  });
});
