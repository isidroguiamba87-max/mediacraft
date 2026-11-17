"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { LangSwitcher } from "@/components/layout/LangSwitcher";

export interface PopupSpeaker {
  slug: string;
  name: string;
  /** "occupation, company" — shown under the name when neither
   * `occupation` nor `company` is set individually. */
  role: string;
  occupation?: string;
  company?: string;
  photoUrl: string | null;
}

/**
 * "Interveniente" popup — shared between the "Painéis" tab (PanelPosters,
 * where it was first built 2026-11-13) and "Programa" (2026-11-17: "podes
 * fazer ser possível quando eu entrar no programa eu poder clicar em um
 * orador e mostrar as informações assim como eu tinha pedido" — same
 * popup, just reachable from a second place now). Shows only what Pulse
 * has (no bio field exists); no standalone profile page any more (removed
 * 2026-11-13 at the client's request) — this popup is the speaker view.
 */
export function SpeakerPopup({
  speaker,
  sessions,
  onClose,
  logoUrl,
  eventTitle,
}: {
  logoUrl: string | null;
  eventTitle: string;
  speaker: PopupSpeaker;
  /** Each session/panel this speaker is on — `label` is "Painel N" from
   * the Painéis tab, or a plain "Sessão" from Programa; `title` the
   * session's own title either way. */
  sessions: { label: string; title: string }[];
  onClose: () => void;
}) {
  const t = useTranslations("speakersDirectory");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const role = speaker.occupation ?? speaker.role;
  const company = speaker.occupation ? speaker.company : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaker-popup-name"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-brand-navy/55 backdrop-blur-[2px]"
      />
      <div className="reveal-up relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white p-6 font-body shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-10">
        {/* header like the event page: the event's logo with its name beside
            it on the left, the language flags + close on the right */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
              <img src={logoUrl} alt="" className="h-10 w-auto max-w-[120px] shrink-0 object-contain sm:h-12" />
            )}
            <span className="max-w-[16rem] text-xs leading-tight font-bold text-brand-navy uppercase sm:text-sm">
              {eventTitle}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LangSwitcher />
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              autoFocus
              className="grid h-9 w-9 place-items-center rounded-full text-slate transition-colors hover:bg-paper-2 hover:text-brand-navy"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mt-6 inline-block border-b-[1.5px] border-brand-red pr-10 pb-1.5 text-lg font-bold tracking-wide text-brand-red uppercase sm:text-xl">
          {t("speakerTitle")}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center sm:gap-10">
          <div className="mx-auto aspect-[4/5] w-48 overflow-hidden rounded-[1.25rem] bg-paper-2 shadow-[0_14px_34px_rgba(0,27,50,0.25)] sm:w-full">
            {speaker.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
              <img src={speaker.photoUrl} alt={speaker.name} className="h-full w-full object-cover object-top" />
            )}
          </div>

          <div>
            <h3 id="speaker-popup-name" className="text-brand-red">
              <span className="block font-body text-2xl leading-tight font-bold sm:text-3xl">{speaker.name}</span>
            </h3>
            {role && <p className="mt-2 text-base leading-snug text-brand-navy">{role}</p>}
            {company && <p className="mt-0.5 text-sm text-slate">{company}</p>}

            {sessions.length > 0 && (
              <>
                <span aria-hidden className="mt-5 block h-px w-full max-w-sm bg-brand-red" />
                <ul className="mt-4 space-y-3">
                  {sessions.map((s, i) => (
                    <li key={`${s.label}-${s.title}-${i}`}>
                      <p className="font-bold text-brand-red">{s.label}:</p>
                      <p className="text-base text-brand-navy">{s.title}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
