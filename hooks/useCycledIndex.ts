"use client";

import { useEffect, useState } from "react";

/**
 * Advances 0 → length-1 → 0 on a fixed interval. Shared by the hero so the
 * sand headline word and its figure always show the same pillar. While
 * `paused` is true the interval stops; it restarts (with a full interval on
 * the current word) once `paused` goes back to false.
 */
export function useCycledIndex(
  length: number,
  intervalMs: number,
  paused = false,
) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1 || paused) return;
    const id = setInterval(
      () => setIndex((v) => (v + 1) % length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [length, intervalMs, paused]);

  return index;
}
