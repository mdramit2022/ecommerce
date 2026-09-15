/** Date helpers are shared app-wide from lib/utils; re-exported so account imports stay short. */
export { formatDate, formatDateTime } from "@/lib/utils";

/** Orders store the ISO 4217 code in lowercase ("npr", historic "usd"); formatters expect uppercase. */
export function currencyCode(currency: string): string {
  return currency.toUpperCase();
}
