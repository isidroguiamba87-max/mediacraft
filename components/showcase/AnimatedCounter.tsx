"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  /** Rendered before the number, e.g. "+". */
  prefix?: string;
  /** Rendered after the number, e.g. "k" or "%". */
  suffix?: string;
  className?: string;
  durationMs?: number;
}

/**
 * Counts up from zero to `value` the first time it scrolls into view,
 * grouping digits for the active locale. Renders the final value straight
 * away when the user prefers reduced motion.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className,
  durationMs = 1800,
}: AnimatedCounterProps) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Vertical-only margin — a 4-side value also shrinks the left/right
  // bounds, and on a narrow viewport a left-column counter's own
  // (narrow, text-width) box can end up never overlapping what's left of
  // the horizontally-shrunk root, so it never fires (confirmed live,
  // 2026-11-03: the left column of NumbersStation's 2-col mobile grid
  // stuck at 0 while the right column counted up normally). This is
  // meant to gate on scroll position anyway, never on horizontal
  // placement.
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  const count = useMotionValue(0);
  const format = (n: number) =>
    new Intl.NumberFormat(locale).format(Math.round(n));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion || !inView) {
      if (reduceMotion) el.textContent = `${prefix}${format(value)}${suffix}`;
      return;
    }

    const controls = animate(count, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${prefix}${format(v)}${suffix}`;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(0)}
      {suffix}
    </span>
  );
}
