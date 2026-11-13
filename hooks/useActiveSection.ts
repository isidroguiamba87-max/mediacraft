"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/config/i18n";

/**
 * Scroll-spy for the one-page home (2026-11-11): returns the id of the
 * home section currently under the reading line (just below the sticky
 * header), or null off the home page. Plain scroll listener + rAF —
 * cheaper and simpler than juggling one IntersectionObserver per section
 * with uneven heights. Cleaned up on unmount.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!onHome) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = 80 + window.innerHeight * 0.3;
      let current: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [onHome, ids]);

  return onHome ? active : null;
}
