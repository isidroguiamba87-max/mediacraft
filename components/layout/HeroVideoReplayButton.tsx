"use client";

import { Play } from "lucide-react";
import { usePathname } from "@/config/i18n";

/**
 * Replays the homepage hero's intro video (2026-10-26: "caso a pessoa
 * queira ver novamente o vídeo, ter um botão de play com um ícone, nada
 * de palavras, do lado do botão de línguas"). Icon-only, homepage only —
 * the video intro (ShowcaseHero) only exists there, so the button has
 * nothing to do anywhere else. No shared state/context between this and
 * the hero (they're siblings in the layout, not nested) — a plain
 * `window` custom event is the simplest way to cross that boundary for
 * a single one-shot "replay" signal.
 */
export function HeroVideoReplayButton() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("mediacraft:replay-hero-video"))}
      aria-label="Ver vídeo de introdução"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-brand-red hover:text-brand-red"
    >
      <Play size={15} fill="currentColor" />
    </button>
  );
}
