import { getTranslations } from "next-intl/server";
import { initials } from "@/lib/utils";
import { buildPanels, groupPanelsByDay, speakerSlug } from "@/lib/pulse/panels";
import { ProgramDayTabs } from "./ProgramDayTabs";
import type { PulseEventSection, PulseEventSpeaker } from "@/lib/pulse/types";

/**
 * "Programa" — the full agenda, one card per session (`sections[].sessions[]`),
 * linking to its own detail page. Used to be two separate tabs ("Programa",
 * a flat expand-in-place list of every session, and "Painéis", cards for
 * only the sessions that had a speaker attached) — merged into one per the
 * user's request (2026-10-01): same card visual for everything, so a
 * session with no speaker (registration, lunch, networking) still shows up
 * instead of silently disappearing the way the old "Painéis"-only filter
 * would have dropped it. `buildPanels` no longer filters by speaker count,
 * so every session becomes a timeline item (see ProgramDayTabs); a session
 * with no speakers just skips the avatar strip. Any top-level speaker not
 * attached to a session
 * (name+company not found on any card) falls back into a small "other
 * speakers" strip below.
 */
export async function Program({
  eventId,
  sections,
  speakers,
}: {
  eventId: string;
  sections: PulseEventSection[];
  speakers: PulseEventSpeaker[];
}) {
  const t = await getTranslations("eventTabs");
  const panels = buildPanels(sections);
  const days = groupPanelsByDay(panels);

  const assigned = new Set(
    panels.flatMap((p) => p.speakers.map((sp) => speakerSlug(sp.name, sp.company))),
  );
  const others = speakers.filter((sp) => !assigned.has(speakerSlug(sp.name, sp.company)));

  if (panels.length === 0 && others.length === 0) {
    return <p className="text-sm text-slate">{t("programEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      {panels.length > 0 && <ProgramDayTabs eventId={eventId} days={days} />}

      {others.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate uppercase">
            {t("speakersOthers")}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {others.map((sp, i) => (
              <div key={`${sp.name}-${i}`} className="flex flex-col items-center gap-2 text-center">
                <Avatar photoUrl={sp.photoUrl} name={sp.name} size={56} />
                <div>
                  <p className="text-xs font-medium text-ink">{sp.name}</p>
                  {(sp.occupation || sp.company) && (
                    <p className="text-[10px] text-slate">
                      {[sp.occupation, sp.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Avatar({
  photoUrl,
  name,
  size,
  ring,
}: {
  photoUrl: string | null;
  name: string;
  size: number;
  ring?: boolean;
}) {
  const style = { width: size, height: size };
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
    <img
      src={photoUrl}
      alt=""
      style={style}
      className={`shrink-0 rounded-full object-cover ${ring ? "border-2 border-paper" : ""}`}
    />
  ) : (
    <span
      style={{ ...style, fontSize: Math.max(10, size * 0.32) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-navy font-display text-white ${ring ? "border-2 border-paper" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
