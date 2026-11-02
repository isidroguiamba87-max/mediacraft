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
  const inView = useInView(ref, { once: true, margin: "-60px" });
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
