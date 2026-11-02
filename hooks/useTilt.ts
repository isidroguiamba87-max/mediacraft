"use client";

import { useRef } from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";

interface TiltResult {
  ref: React.RefObject<HTMLDivElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

/**
 * Subtle 3D tilt-on-hover effect for cards (used by the hero visual on the
 * home page). Movement is capped and spring-smoothed so it stays elegant
 * rather than gimmicky, and it's inert on touch devices (no hover event).
 */
export function useTilt(maxDegrees = 6): TiltResult {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    const px = (e.clientX - bounds.left) / bounds.width - 0.5;
    const py = (e.clientY - bounds.top) / bounds.height - 0.5;
    rotateY.set(px * maxDegrees * 2);
    rotateX.set(-py * maxDegrees * 2);
  }

  function onMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}
