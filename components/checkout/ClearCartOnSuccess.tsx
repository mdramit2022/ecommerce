"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/store/useCart";

/**
 * Empties the persisted Zustand cart once after a successful checkout. Renders nothing.
 * Waits for the persist middleware to hydrate first - otherwise hydration would restore
 * the items we just cleared.
 */
export function ClearCartOnSuccess() {
  useEffect(() => {
    const clear = () => useCart.getState().clearCart();
    if (useCart.persist.hasHydrated()) {
      clear();
      return;
    }
    return useCart.persist.onFinishHydration(clear);
  }, []);

  return null;
}
