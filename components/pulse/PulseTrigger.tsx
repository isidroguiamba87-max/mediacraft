"use client";

import { useTranslations } from "next-intl";
import { usePulse } from "./PulseContext";

export function PulseTrigger({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { openPulse } = usePulse();

  return (
    <button type="button" onClick={openPulse} className={className}>
      {t("pulse")}
    </button>
  );
}
