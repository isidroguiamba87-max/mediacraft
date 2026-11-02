"use client";

import { createContext, useContext } from "react";

interface PulseContextValue {
  /** Opens the Pulse login modal (see PulseLauncher). */
  openPulse: () => void;
}

export const PulseContext = createContext<PulseContextValue | null>(null);

/** Read the Pulse launcher's `openPulse` action. Must be used under
 * <PulseLauncher> (mounted once in app/[locale]/layout.tsx). */
export function usePulse() {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error("usePulse must be used within <PulseLauncher>");
  return ctx;
}
