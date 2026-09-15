export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Reduce Next's `string | string[] | undefined` search params to single non-empty strings. */
export function firstValues(params: RawSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === "string" && single !== "") out[key] = single;
  }
  return out;
}

/** Same as `firstValues` but for a `URLSearchParams` (Route Handlers). */
export function searchParamsToRecord(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (value !== "" && !(key in out)) out[key] = value;
  }
  return out;
}

/** Build a path with a query string, dropping empty/undefined values. */
export function buildPath(
  basePath: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Only allow redirects back into the admin area (guards the hidden `returnTo` form field). */
export function safeAdminReturnTo(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^\/admin(?:\/|\?|$)/.test(value)) return value;
  return fallback;
}

/** Append a flash-style `notice` or `error` message to an admin path (read by <Notice />). */
export function withMessage(path: string, kind: "notice" | "error", message: string): string {
  const url = new URL(path, "http://admin.local");
  url.searchParams.delete("notice");
  url.searchParams.delete("error");
  url.searchParams.set(kind, message.slice(0, 300));
  return `${url.pathname}${url.search}`;
}
