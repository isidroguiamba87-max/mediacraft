"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import type { PillarDetail } from "@/content/pillarDetails";

/**
 * "Ver mais" popup (home hero pillars and "O que fazemos?" services): the
 * full text, justified, in a white card styled like the team bio popup
 * (2026-11-20), with the theme's photo on the right. Esc, the ✕ or a click
 * on the backdrop close it; page scroll is locked while open.
 */
export function PillarDetailModal({
  detail,
  photo,
  closeLabel,
  onClose,
}: {
  detail: PillarDetail;
  photo?: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Latest onClose without re-running the open/close effect (which would
  // bounce focus and the scroll lock) whenever the parent re-renders.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, []);

  // Same look as the team bio popup (2026-11-20: "replicar essa forma… um
  // fundo branco"): white card, title + ✕ on top, justified text on the left,
  // the theme's photo in a rounded card on the right (on top on phones).
  const paragraph = "font-body text-sm leading-[1.6] text-ink/80 text-justify hyphens-auto sm:text-[15px]";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-navy/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pillar-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="reveal-up relative flex max-h-[88svh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.25rem] bg-white px-6 pt-5 pb-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:px-8 sm:pb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="pillar-detail-title" className="pt-2 font-display text-xl leading-tight text-brand-navy sm:text-2xl">
            {detail.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-red"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
        <span aria-hidden className="mt-2 block h-0.5 w-12 bg-brand-red" />

        {/* Title and photo stay put; only the text scrolls (2026-11-23: "as
            imagens não se moverem quando faço o scroll"). Phone: photo on
            top, text scrolling under it. sm+: text left, photo right. */}
        <div className="mt-5 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 sm:grid-cols-[1fr_13rem] sm:grid-rows-[minmax(0,1fr)] sm:gap-7">
          {photo && (
            <div className="relative aspect-[16/9] max-h-[28svh] shrink-0 self-start overflow-hidden rounded-2xl border border-line sm:order-2 sm:aspect-[4/5] sm:max-h-none">
              <Image src={photo} alt="" fill sizes="(min-width: 640px) 13rem, 100vw" className="object-cover" />
            </div>
          )}

          <div className={`flex min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 sm:order-1 ${photo ? "" : "row-span-2 sm:col-span-2"}`}>
            {detail.intro.map((p, i) => (
              <p key={`i${i}`} className={paragraph}>
                {p}
              </p>
            ))}

            {detail.listLead && <p className={paragraph}>{detail.listLead}</p>}
            {detail.points && (
              <ul className="flex flex-col gap-2">
                {detail.points.map((pt) => (
                  <li key={pt.label} className={`flex gap-2.5 ${paragraph}`}>
                    <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                    <span>
                      <strong className="font-bold text-brand-navy">{pt.label}:</strong> {pt.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {detail.sections && (
              <ol className="flex flex-col gap-3">
                {detail.sections.map((sec, i) => (
                  <li key={sec.title}>
                    <h3 className="flex items-baseline gap-2 font-body text-[15px] font-bold text-brand-navy sm:text-base">
                      <span className="text-brand-red tabular-nums">{i + 1}.</span>
                      {sec.title}
                    </h3>
                    <p className={`mt-1 ${paragraph}`}>{sec.text}</p>
                  </li>
                ))}
              </ol>
            )}

            {detail.outro.map((p, i) => (
              <p key={`o${i}`} className={paragraph}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
