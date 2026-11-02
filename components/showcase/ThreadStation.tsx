"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMounted } from "@/hooks/useMounted";

/**
 * Wraps one section so the {@link ScrollThread} can find it (`data-thread-station`)
 * and so its content rises into view as the current reaches it. Server/first
 * render and reduced motion output a plain wrapper — no hydration mismatch,
 * readable without JS.
 */
export function ThreadStation({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const reduce = useReducedMotion();

  if (!mounted || reduce) {
    return <div data-thread-station>{children}</div>;
  }

  return (
    <motion.div
      data-thread-station
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
