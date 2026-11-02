"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A soft radial highlight that tracks the pointer across its parent
 * section — drop as the first child of any `relative overflow-hidden`
 * dark block. Finds its own parent via a ref and attaches the mousemove
 * listener there on mount, so the host can stay a plain (even async
 * Server) component — no `onMouseMove` prop to wire up anywhere. Position
 * and visibility are CSS custom properties mutated directly on the DOM
 * node, never React state, so pointer movement never triggers a
 * re-render.
 */
export function MouseGlow({
  className,
  color = "rgba(191,38,46,0.35)",
  size = 480,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    function onMove(e: MouseEvent) {
      const rect = parent!.getBoundingClientRect();
      parent!.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
      parent!.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
      parent!.style.setProperty("--glow-opacity", "1");
    }
    function onLeave() {
      parent!.style.setProperty("--glow-opacity", "0");
    }

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 transition-opacity duration-300", className)}
      style={{
        opacity: "var(--glow-opacity, 0)",
        background: `radial-gradient(${size}px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${color}, transparent 70%)`,
      }}
    />
  );
}
