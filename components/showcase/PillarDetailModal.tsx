"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import type { PillarDetail } from "@/content/pillarDetails";

/**
 * "Ver mais" popup for one home-hero pillar (2026-11-19): the full text
 * for Comunicação / Reputação / Eventos, justified, set over that same
 * pillar's hero photo under a navy wash. Esc, the ✕ or a click on the
 * backdrop close it; page scroll is locked while open.
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

  const paragraph = "font-body text-[15px] leading-relaxed text-white/90 text-justify hyphens-auto sm:text-base";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pillar-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="reveal-up relative flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] bg-brand-navy text-white shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        {/* The pillar's own hero photo as the text's backdrop, washed dark
            enough for long white copy to stay comfortable to read. */}
        {photo && (
          <Image
            src={photo}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 768px) 48rem, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 60%" }}
          />
        )}
        <span aria-hidden className="absolute inset-0 bg-brand-navy/85" />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-white"
        >
          <X aria-hidden className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="relative overflow-y-auto px-6 pt-12 pb-8 sm:px-10 sm:pt-14 sm:pb-10">
          <h2
            id="pillar-detail-title"
            className="font-body text-xl leading-tight font-bold tracking-wide uppercase sm:text-2xl"
          >
            {detail.title}
          </h2>
          <span aria-hidden className="mt-3 block h-0.5 w-12 bg-brand-red" />

          <div className="mt-6 flex flex-col gap-4">
            {detail.intro.map((p, i) => (
              <p key={`i${i}`} className={paragraph}>
                {p}
              </p>
            ))}

            {detail.listLead && <p className={paragraph}>{detail.listLead}</p>}
            {detail.points && (
              <ul className="flex flex-col gap-3">
                {detail.points.map((pt) => (
                  <li key={pt.label} className={`flex gap-3 ${paragraph}`}>
                    <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                    <span>
                      <strong className="font-bold text-white">{pt.label}:</strong> {pt.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {detail.sections && (
              <ol className="flex flex-col gap-5">
                {detail.sections.map((sec, i) => (
                  <li key={sec.title}>
                    <h3 className="flex items-baseline gap-2 font-body text-base font-bold text-white sm:text-lg">
                      <span className="text-brand-red tabular-nums">{i + 1}.</span>
                      {sec.title}
                    </h3>
                    <p className={`mt-1.5 ${paragraph}`}>{sec.text}</p>
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
