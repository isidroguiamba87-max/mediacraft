"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** How long the page must be still before the header comes back. */
const IDLE_MS = 220;

/**
 * Sticky header shell that goes fully transparent — and lets clicks pass
 * through to the page underneath — while the user is scrolling, then
 * fades back in and becomes clickable again once scrolling stops. At the
 * very top of the page it always stays visible. Keyboard focus inside the
 * header also brings it back, so tabbing never lands on an invisible link.
 */
export function ScrollFadeHeader({ children }: { children: React.ReactNode }) {
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (window.scrollY <= 0) {
        clearTimeout(timer);
        setScrolling(false);
        return;
      }
      setScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), IDLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <header
      onFocusCapture={() => setScrolling(false)}
      className={cn(
        "sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur transition-opacity duration-300 ease-out motion-reduce:transition-none",
        scrolling && "pointer-events-none opacity-0",
      )}
    >
      {children}
    </header>
  );
}
