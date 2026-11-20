"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The history narrative with the earlier "Ver mais" treatment restored
 * (2026-11-17): first paragraph in full, the second clamped to three lines
 * fading out, the rest hidden until expanded. Type enlarged 2026-11-19
 * ("podes aumentar o historial"): 16px → 19px, navy, medium weight, as in the
 * client's image.
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
    <div className="mt-6 flex flex-col gap-6 font-body text-base leading-relaxed font-medium text-brand-navy text-justify hyphens-auto sm:text-lg lg:text-[1.1875rem]">
      <p>{first}</p>

      {second && (
        <div className="relative">
          <p className={cn(!expanded && "line-clamp-3")}>{second}</p>
          {!expanded && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent"
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
          className="flex items-center gap-1.5 self-start font-body text-base font-bold text-brand-red hover:underline"
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
