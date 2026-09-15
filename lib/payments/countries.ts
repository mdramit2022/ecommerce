/**
 * Shipping destinations the storefront serves.
 *
 * Pure data, so both the checkout form (Client Component) and the Stripe Checkout Session
 * (`lib/orders/place.ts`) work from the same list. Codes are ISO 3166-1 alpha-2 and must stay
 * valid Stripe `allowed_countries` values.
 */

export const SHIPPING_COUNTRIES = [
  { code: "NP", name: "Nepal" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
] as const;

export type ShippingCountry = (typeof SHIPPING_COUNTRIES)[number];
export type ShippingCountryCode = ShippingCountry["code"];

export const SHIPPING_COUNTRY_CODES = SHIPPING_COUNTRIES.map((country) => country.code);

export const DEFAULT_SHIPPING_COUNTRY: ShippingCountryCode = "NP";

/** Human-readable country name, falling back to the raw code for historic order snapshots. */
export function countryName(code: string): string {
  const upper = code.trim().toUpperCase();
  return SHIPPING_COUNTRIES.find((country) => country.code === upper)?.name ?? upper;
}

export function isSupportedShippingCountry(code: string): boolean {
  const upper = code.trim().toUpperCase();
  return SHIPPING_COUNTRIES.some((country) => country.code === upper);
}
