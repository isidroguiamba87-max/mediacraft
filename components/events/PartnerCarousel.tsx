"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselPartner {
  name: string;
  logoUrl: string | null;
  link: string | null;
  /** Section it came from ("Patrocinador Ouro"…) — shown as a tooltip. */
  group: string;
}

/**
 * Row of white, red-bordered logo cards with round arrow buttons either
 * side (event "Parceiros e Apoios"). Scroll-snap track, so it also swipes
 * natively on touch; the arrows page by the visible width and grey out at
 * either end.
 */
export function PartnerCarousel({ partners }: { partners: CarouselPartner[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1580c4] text-white transition-opacity hover:bg-[#106aa3] disabled:cursor-default disabled:opacity-30";

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <button type="button" aria-label="Anterior" onClick={() => page(-1)} disabled={atStart} className={arrow}>
        <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={3} />
      </button>

      <ul
        ref={trackRef}
        onScroll={update}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto py-1 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {partners.map((p, i) => {
          const card = (
            <span
              title={p.group ? `${p.name} · ${p.group}` : p.name}
              className="flex h-16 w-full items-center justify-center rounded-[1rem] border border-brand-red/70 bg-white px-4 py-2.5 sm:h-[4.5rem]"
            >
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                <img src={p.logoUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="truncate font-body text-sm font-bold text-brand-navy">
                  {p.name}
                </span>
              )}
            </span>
          );
          return (
            <li
              key={`${p.name}-${i}`}
              className={cn("w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-3rem)/4)]")}
            >
              {p.link ? (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="block">
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" aria-label="Seguinte" onClick={() => page(1)} disabled={atEnd} className={arrow}>
        <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
