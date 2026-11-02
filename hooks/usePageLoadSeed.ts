"use client";

import { useSyncExternalStore } from "react";

/**
 * A number that's stable for this page's whole lifetime but differs on
 * every real navigation/reload — used to pick a single photo out of
 * several for a theme that has more than one, so a visitor sees a
 * different one each visit without it flickering mid-session (2026-10-22:
 * "o que tiver muitas fotos é só intercalar, se dessa vez mostra essa, na
 * próxima volta é a outra").
 *
 * `performance.timeOrigin` is an impure read, so it's wrapped in
 * `useSyncExternalStore` — the same escape hatch this codebase already
 * uses elsewhere for impure render-time reads (e.g. PanelRatingButton's
 * `hasEnded`). Unlike `Math.random()`, a plain number stays stable across
 * repeated reads within one page load, so there's no infinite-render risk
 * from `useSyncExternalStore` seeing a "new" snapshot every call.
 * `getServerSnapshot` fixes it at 0 so SSR and the first client paint
 * always agree on the same (first) image.
 */
export function usePageLoadSeed(): number {
  return useSyncExternalStore(
    () => () => {},
    () => performance.timeOrigin,
    () => 0,
  );
}

/** Pure helper pairing the seed above with an image list — `images[0]`
 * when there's only one, otherwise a stable pick for this page load. */
export function pickStablePhoto(images: string[], seed: number): string {
  if (images.length <= 1) return images[0];
  return images[Math.floor(seed) % images.length];
}
