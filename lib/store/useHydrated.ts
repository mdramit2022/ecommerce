"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once the component has mounted on the client.
 * Use it to avoid hydration mismatches when rendering persisted Zustand state
 * (e.g. cart item counts) that only exists in `localStorage`.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
