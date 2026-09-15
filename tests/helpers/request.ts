import { NextRequest } from "next/server";

/** Build a GET `NextRequest` with the given headers for Route Handler / rate-limit tests. */
export function makeRequest(
  headers: Record<string, string> = {},
  url = "http://localhost:3000/api/test",
): NextRequest {
  return new NextRequest(url, { headers });
}
