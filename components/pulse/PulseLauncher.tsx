"use client";

import { useCallback, useMemo, useState } from "react";
import { PulseContext } from "./PulseContext";
import { LoginModal } from "./LoginModal";
import { ConsoleShell } from "./ConsoleShell";

type Stage = "closed" | "login" | "console";

/**
 * Mounted once in app/[locale]/layout.tsx. Owns the Pulse demo's
 * login-then-console flow and exposes `openPulse()` (via PulseContext) so
 * any descendant — the header trigger, the footer "Pulse" link — can open
 * it without prop drilling.
 */
export function PulseLauncher({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("closed");

  const openPulse = useCallback(() => setStage("login"), []);
  const value = useMemo(() => ({ openPulse }), [openPulse]);

  return (
    <PulseContext.Provider value={value}>
      {children}
      <LoginModal
        open={stage === "login"}
        onClose={() => setStage("closed")}
        onEnter={() => setStage("console")}
      />
      {stage === "console" && <ConsoleShell onExit={() => setStage("closed")} />}
    </PulseContext.Provider>
  );
}
