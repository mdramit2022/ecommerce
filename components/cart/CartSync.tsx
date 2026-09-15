"use client";

import { useEffect, useRef } from "react";
import { fetchServerCart, pushServerCart } from "@/lib/cart/client";
import { useCart } from "@/lib/store/useCart";

export type CartSyncProps = {
  /** Signed-in user id, or null for guests. Provided by the root layout. */
  userId: string | null;
};

const PUSH_DEBOUNCE_MS = 600;

/** The persisted store hydrates synchronously from localStorage, but never assume it. */
async function waitForHydration(): Promise<void> {
  if (useCart.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = useCart.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

/**
 * Keeps the persisted Zustand cart and the server-side cart (`/api/cart`) in sync for signed-in
 * users. Guests (`userId === null`) are left alone.
 *
 * On sign-in (once per user id): GET the server cart, merge it into the local store, PUT the merged
 * result back and adopt the canonical server copy. Afterwards every local change is debounced and
 * PUT to the server. Never throws - failures are logged with `console.warn`. Renders nothing.
 */
export function CartSync({ userId }: CartSyncProps) {
  // Refs survive StrictMode's mount -> unmount -> mount so the merge runs once per user id.
  const mergedForRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      // Signed out: a later sign-in (even as the same user) should merge again.
      mergedForRef.current = null;
      return;
    }

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const push = async () => {
      const result = await pushServerCart(useCart.getState().items);
      if (!result.ok) {
        console.warn(`[CartSync] Failed to save cart (${result.status}): ${result.error}`);
      }
    };

    const schedulePush = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void push().catch((error: unknown) => console.warn("[CartSync] Save failed", error));
      }, PUSH_DEBOUNCE_MS);
    };

    const unsubscribe = useCart.subscribe((state, previous) => {
      if (state.items === previous.items) return;
      if (syncingRef.current) {
        // Changes made while the initial merge is in flight are pushed once it settles.
        dirtyRef.current = true;
        return;
      }
      schedulePush();
    });

    if (mergedForRef.current !== userId) {
      mergedForRef.current = userId;
      syncingRef.current = true;
      dirtyRef.current = false;

      void (async () => {
        try {
          await waitForHydration();

          const remote = await fetchServerCart();
          if (!remote.ok) {
            console.warn(`[CartSync] Failed to load cart (${remote.status}): ${remote.error}`);
            return;
          }

          const store = useCart.getState();
          store.mergeItems(remote.cart.items);
          const merged = useCart.getState().items;

          const saved = await pushServerCart(merged);
          if (!saved.ok) {
            console.warn(`[CartSync] Failed to save cart (${saved.status}): ${saved.error}`);
            return;
          }

          // Adopt the canonical server copy (stock clamps, retired products) unless the user
          // edited the cart while the request was in flight - their edits win and push later.
          if (useCart.getState().items === merged) {
            useCart.getState().setItems(saved.cart.items);
            dirtyRef.current = false;
          }
        } catch (error) {
          console.warn("[CartSync] Initial sync failed", error);
        } finally {
          syncingRef.current = false;
          if (dirtyRef.current && !disposed) {
            dirtyRef.current = false;
            schedulePush();
          }
        }
      })();
    }

    return () => {
      disposed = true;
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
