"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The history narrative with the earlier "Ver mais" treatment restored
 * (2026-11-17): first paragraph in full, the second clamped to three lines
 * fading out, the rest hidden until expanded.
 */
export function HistoryText({
  paragraphs,
  readMore,
  readLess,
}: {
  paragraphs: string[];
  readMore: string;
  readLess: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [first, second, ...rest] = paragraphs;

  return (
    <div className="mt-5 flex flex-col gap-5 font-body text-sm leading-relaxed text-ink text-justify hyphens-auto sm:text-[15px]">
      <p>{first}</p>

      {second && (
        <div className="relative">
          <p className={cn(!expanded && "line-clamp-3")}>{second}</p>
          {!expanded && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
            />
          )}
        </div>
      )}

      {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}

      {second && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 self-start font-body text-sm font-bold text-brand-red hover:underline"
        >
          {expanded ? readLess : readMore}
          <ChevronDown
            aria-hidden
            size={16}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}
