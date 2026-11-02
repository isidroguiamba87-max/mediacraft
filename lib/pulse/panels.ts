import type {
  PulseEventSection,
  PulseEventSpeaker,
  PulseSessionRoom,
  PulseSessionSpeaker,
  PulseSpeakerLink,
} from "./types";

/**
 * A "panel" is one agenda session — Pulse has no standalone panel entity,
 * this is just `sections[].sessions[]` flattened and renamed for the UI's
 * card-grid vocabulary. Every session becomes a card, speakers or not
 * (2026-10-01: previously filtered to sessions with at least one speaker,
 * which silently dropped speaker-less items like registration/lunch/
 * networking breaks from the "Painéis" tab — now that "Programa" and
 * "Painéis" are a single merged tab, nothing should disappear). Shared
 * between the Programa tab (list) and its detail page so both derive the
 * exact same panels in the exact same order from the same `sections[]`.
 *
 * `key` prefers the session's real `id`, but that's been confirmed MISSING
 * on at least one real production event (every session, no exceptions) —
 * so it falls back to a positional key (`p-<index>` in this flattened
 * list) that's stable for a given fetch/render but not a permanent
 * identifier (a backend reorder would shift it). Good enough since Pulse
 * gives us nothing better.
 */
export interface Panel {
  key: string;
  sectionTitle: string;
  title: string;
  description: string;
  /** The session's own ISO date — used to group the agenda by day (see
   * `groupPanelsByDay`), separately from `sectionTitle` (a named track,
   * not necessarily a day). */
  date: string;
  timeFrom: string;
  timeTo: string;
  rooms: PulseSessionRoom[];
  speakers: PulseSessionSpeaker[];
}

/** Speakers have no reliable id either (same story as `Panel.key` above) —
 * this builds one from name+company, good enough to match the same person
 * across sections/sessions and to use as a URL-safe key for their profile
 * route. Shared by Program (matching session speakers to the top-level
 * roster), the Oradores directory/profile pages, and SessionSpeakerList
 * (2026-10-12, Networking). */
export function speakerSlug(name: string, company: string): string {
  return `${name}-${company}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPanels(sections: PulseEventSection[]): Panel[] {
  const panels: Panel[] = [];
  let index = 0;
  for (const section of sections) {
    for (const session of section.sessions) {
      panels.push({
        key: session.id ?? `p-${index}`,
        sectionTitle: section.title,
        title: session.title,
        description: session.description,
        date: session.date,
        timeFrom: session.timeFrom,
        timeTo: session.timeTo,
        rooms: session.rooms,
        speakers: session.speakers,
      });
      index += 1;
    }
  }
  return panels;
}

export interface DayGroup {
  /** `null` when there's only one day overall (or no usable dates at all)
   * — callers should skip showing a day header in that case, not print a
   * lone "Dia 1". */
  date: string | null;
  sections: { title: string; panels: Panel[] }[];
}

/** Groups panels by day (`panel.date`), then by section within each day —
 * "separated by day and by section", per the 2026-10-06 request. A day
 * header only makes sense once there's more than one distinct date; a
 * single-day (or dateless) program just gets its section groups, same as
 * before. Order preserved: days chronologically, sections in first-seen
 * order within each day. */
export function groupPanelsByDay(panels: Panel[]): DayGroup[] {
  const dayKeys: string[] = [];
  const byDay = new Map<string, Panel[]>();
  for (const panel of panels) {
    const key = panel.date ? panel.date.slice(0, 10) : "";
    if (!byDay.has(key)) {
      dayKeys.push(key);
      byDay.set(key, []);
    }
    byDay.get(key)!.push(panel);
  }

  const sortedKeys = [...dayKeys].sort((a, b) => (a || "9999").localeCompare(b || "9999"));
  const multiDay = sortedKeys.filter(Boolean).length > 1;

  function toSections(dayPanels: Panel[]) {
    const titles: string[] = [];
    const bySection = new Map<string, Panel[]>();
    for (const panel of dayPanels) {
      if (!bySection.has(panel.sectionTitle)) {
        titles.push(panel.sectionTitle);
        bySection.set(panel.sectionTitle, []);
      }
      bySection.get(panel.sectionTitle)!.push(panel);
    }
    return titles.map((title) => ({ title, panels: bySection.get(title)! }));
  }

  if (!multiDay) {
    return [{ date: null, sections: toSections(panels) }];
  }

  return sortedKeys.map((key) => ({
    date: key || null,
    sections: toSections(byDay.get(key)!),
  }));
}

export interface SpeakerDirectoryEntry {
  slug: string;
  name: string;
  company: string;
  occupation: string;
  photoUrl: string | null;
  links: PulseSpeakerLink[];
  sessions: { key: string; title: string }[];
}

/** The full, de-duplicated roster for one event's Oradores tab/profile
 * page (2026-10-12, Networking) — merges the top-level `event.speakers[]`
 * with every session's own `speakers[]`, keyed by `speakerSlug` (same
 * identity logic as Program's "other speakers" strip), and records which
 * sessions each one actually appears in. A speaker only on `event.speakers`
 * (not attached to any session) still gets an entry, just with an empty
 * `sessions` list. */
export function buildSpeakerDirectory(
  topLevelSpeakers: PulseEventSpeaker[],
  sections: PulseEventSection[],
): SpeakerDirectoryEntry[] {
  const panels = buildPanels(sections);
  const bySlug = new Map<string, SpeakerDirectoryEntry>();

  function upsert(sp: {
    name: string;
    company: string;
    occupation: string;
    photoUrl: string | null;
    links: PulseSpeakerLink[];
  }) {
    const slug = speakerSlug(sp.name, sp.company);
    const existing = bySlug.get(slug);
    if (existing) return existing;
    const entry: SpeakerDirectoryEntry = {
      slug,
      name: sp.name,
      company: sp.company,
      occupation: sp.occupation,
      photoUrl: sp.photoUrl,
      links: sp.links,
      sessions: [],
    };
    bySlug.set(slug, entry);
    return entry;
  }

  for (const sp of topLevelSpeakers) upsert(sp);

  for (const panel of panels) {
    for (const sp of panel.speakers) {
      const entry = upsert(sp);
      if (!entry.sessions.some((s) => s.key === panel.key)) {
        entry.sessions.push({ key: panel.key, title: panel.title });
      }
    }
  }

  return [...bySlug.values()];
}
