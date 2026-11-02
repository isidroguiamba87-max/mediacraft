"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during SSR and the first client render, `true` afterwards. Use to
 * defer client-only enhancements (e.g. motion wrappers whose initial state
 * would otherwise differ from the server markup) until after hydration.
 *
 * Implemented with `useSyncExternalStore` so there is no state-in-effect and
 * the server/client snapshots are explicit.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
