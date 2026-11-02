"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/config/i18n";
import { ConnectButton } from "@/components/networking/ConnectButton";
import { withResolvedChannels } from "@/lib/networking/parseChannels";
import type { SpeakerDirectoryEntry } from "@/lib/pulse/panels";
import { Avatar } from "./Program";

/**
 * "Oradores" (2026-10-12, Networking) — the permanent discovery surface
 * for the `speakers_directory` funnel path, alongside the session-based
 * one already wired into the panel detail page. Search by name + filter
 * by session, per spec ("directório permanente de descoberta").
 */
export function Oradores({
  eventId,
  isFree,
  speakers,
}: {
  eventId: string;
  isFree: boolean;
  speakers: SpeakerDirectoryEntry[];
}) {
  const t = useTranslations("speakersDirectory");
  const [query, setQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  const sessionOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const sp of speakers) {
      for (const s of sp.sessions) seen.set(s.key, s.title);
    }
    return [...seen.entries()];
  }, [speakers]);

  const filtered = speakers.filter((sp) => {
    if (query && !sp.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (sessionFilter && !sp.sessions.some((s) => s.key === sessionFilter)) return false;
    return true;
  });

  if (speakers.length === 0) {
    return <p className="text-sm text-slate">{t("empty")}</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-brand border border-line pr-4 pl-10 text-sm outline-none focus-visible:border-brand-red"
          />
        </div>
        {sessionOptions.length > 0 && (
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="h-11 rounded-brand border border-line bg-paper px-3 text-sm outline-none focus-visible:border-brand-red sm:w-56"
          >
            <option value="">{t("allSessions")}</option>
            {sessionOptions.map(([key, title]) => (
              <option key={key} value={key}>
                {title}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate">{t("noResults")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((sp) => (
            <div key={sp.slug} className="flex flex-col items-center rounded-brand border border-line p-4 text-center">
              <Link href={`/eventos/${eventId}/oradores/${sp.slug}`} className="flex flex-col items-center">
                <Avatar photoUrl={sp.photoUrl} name={sp.name} size={72} />
                <p className="mt-3 w-full truncate font-display text-sm text-brand-navy transition-colors hover:text-brand-red">
                  {sp.name}
                </p>
              </Link>
              {(sp.occupation || sp.company) && (
                <p className="mt-1 w-full truncate text-xs text-slate">
                  {[sp.occupation, sp.company].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-3">
                <ConnectButton
                  speaker={withResolvedChannels(sp)}
                  eventId={eventId}
                  isFree={isFree}
                  source="speakers_directory"
                  variant="compact"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
