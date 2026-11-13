"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/config/i18n";
import { cn } from "@/lib/utils";
import type { SpeakerDirectoryEntry } from "@/lib/pulse/panels";

const OTHERS = "__others";

/**
 * "Oradores" organised by panel: a row of pill tabs ("Painel 1",
 * "Painel 2"… one per agenda session that has speakers, in program
 * order; plus "Outros" for speakers not attached to any session), then a
 * grid of square navy photo tiles with the speaker's name (gold, caps)
 * and role over the foot of the photo. Each tile opens the speaker's
 * profile page, where the networking "connect" action lives.
 */
export function Oradores({
  eventId,
  speakers,
  panels,
}: {
  eventId: string;
  speakers: SpeakerDirectoryEntry[];
  /** Agenda sessions that have at least one speaker, in program order. */
  panels: { key: string; title: string }[];
}) {
  const t = useTranslations("speakersDirectory");
  const unassigned = speakers.filter((sp) => sp.sessions.length === 0);
  const tabs = [
    ...panels.map((p, i) => ({ key: p.key, label: t("panelLabel", { n: i + 1 }), title: p.title })),
    ...(unassigned.length > 0 ? [{ key: OTHERS, label: t("others"), title: t("others") }] : []),
  ];
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "");

  if (speakers.length === 0) {
    return <p className="text-sm text-slate">{t("empty")}</p>;
  }

  const shown =
    tabs.length === 0
      ? speakers
      : activeKey === OTHERS
        ? unassigned
        : speakers.filter((sp) => sp.sessions.some((s) => s.key === activeKey));

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label={t("panelsTitle")} className="flex flex-wrap gap-2.5 sm:gap-3">
          {tabs.map((tab) => {
            const active = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                title={tab.title}
                onClick={() => setActiveKey(tab.key)}
                className={cn(
                  "rounded-full border px-6 py-1.5 font-body text-[15px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
                  active
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-brand-navy bg-white text-brand-navy hover:border-brand-red hover:text-brand-red",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <ul
        className={cn(
          "grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7 xl:gap-3.5",
          tabs.length > 1 && "mt-8 sm:mt-10",
        )}
      >
        {shown.map((sp) => (
          <li key={sp.slug}>
            <Link
              href={`/eventos/${eventId}/oradores/${sp.slug}`}
              className="group relative block aspect-square overflow-hidden rounded-[1.25rem] bg-[#001833] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              {sp.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                <img
                  src={sp.photoUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#001833] via-[#001833]/70 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 px-2 pb-2.5 text-center">
                <span className="block truncate font-body text-[11px] leading-tight font-extrabold tracking-wide text-[#F2C14E] uppercase sm:text-xs">
                  {sp.name}
                </span>
                {(sp.occupation || sp.company) && (
                  <span className="mt-0.5 line-clamp-2 block font-body text-[8px] leading-tight font-semibold text-white uppercase sm:text-[9px]">
                    {[sp.occupation, sp.company].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
