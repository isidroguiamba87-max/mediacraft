import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import sanitizeHtml from "sanitize-html";

/** Merge class names, resolving conflicting Tailwind utilities sanely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Supabase Storage object keys reject spaces, accents and a lot of
 * punctuation — a real screenshot/export filename like "Captura de ecrã
 * 2026-07-21 003902.png" throws a hard `StorageApiError: Invalid key`
 * otherwise (confirmed live, 2026-10-06, uploading a news cover). Strips
 * accents, swaps anything that isn't alphanumeric/dot/dash for a dash, and
 * collapses repeats. Always call this on `file.name` right before building
 * any Storage upload path from it — see lib/supabase/{news,gallery,
 * documents,eventOverrides}.ts. */
export function sanitizeFileName(name: string): string {
  const stripped = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const cleaned = stripped
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "file";
}

/** Plain-text summary from Pulse's organizer-authored rich text (e.g.
 * `Event.details` — confirmed 2026-09-16 against the staging API to be
 * real HTML from a WYSIWYG editor, not plain text). For `<meta
 * description>`/social-share tags, where raw markup would otherwise show
 * up as literal "&lt;h1&gt;..." in search results and share previews —
 * `SafeHtml` (components/ui/SafeHtml.tsx) is for rendering it as markup
 * in the page body instead. */
export function stripHtml(html: string, maxLength = 160) {
  // Insert a space at block boundaries first, or adjacent blocks run
  // together with no separator (e.g. "...2026Feira Internacional...").
  const spaced = html.replace(/<\/(p|div|h[1-6]|li|br)>/gi, " ");
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** Format an ISO date string for the given locale, e.g. "12 de março de 2026". */
export function formatDate(
  iso: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    locale,
    options ?? { day: "2-digit", month: "long", year: "numeric" },
  ).format(new Date(iso));
}

/** Format a date range, collapsing to a single date when start === end. */
export function formatDateRange(
  startIso: string,
  endIso: string,
  locale: string,
) {
  if (startIso.slice(0, 10) === endIso.slice(0, 10)) {
    return formatDate(startIso, locale);
  }
  return `${formatDate(startIso, locale)} – ${formatDate(endIso, locale)}`;
}

/** "Vanessa Cadir" -> "VC". Used for avatar fallbacks (team, speakers, chat). */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Format an amount as currency for the given locale. Pulse doesn't send a
 * currency code alongside ticket prices — MZN is MediaCraft's only market
 * so it's hardcoded here rather than threaded through every call site. */
export function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "MZN" }).format(
    amount,
  );
}

/** Earliest/latest date across a Pulse `scheduleDates[]` array — event
 * detail pages can span several non-contiguous dates. Returns null for an
 * empty array — a real case: the backend's repository always filters
 * `scheduleDates` to `date >= now`, so a past event's detail can come
 * back with none at all (confirmed 2026-09-14). */
export function scheduleDateRange(dates: { date: string }[]) {
  if (dates.length === 0) return null;
  const times = dates.map((d) => new Date(d.date).getTime());
  return {
    start: new Date(Math.min(...times)).toISOString(),
    end: new Date(Math.max(...times)).toISOString(),
  };
}

/** Soonest date in a `scheduleDates[]` array, or null if empty (see
 * `scheduleDateRange`'s note on why that happens). */
export function earliestScheduleDate(dates: { date: string }[]) {
  if (dates.length === 0) return null;
  return dates.reduce((soonest, d) => (d.date < soonest ? d.date : soonest), dates[0].date);
}

/** Calendar-day difference between an ISO date and today (0 = today, 1 =
 * tomorrow, negative = already started/past) — ignores time-of-day so an
 * event later today still reads as "0 days away", not a fraction. */
export function daysUntil(iso: string) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / msPerDay);
}

/** Mirrors the Pulse backend's own validation
 * (`mozambiqueNationalNumberRegex = /^[28][234567]\d{7}$/`, plus a
 * method-specific first-two-digits rule in `enroll.validation.ts`) so the
 * UI can reject an obviously-wrong mobile money number before a round
 * trip. Kept in sync manually — if Pulse changes the rule, this drifts. */
export function isValidMobileMoneyNumber(phoneNumber: string, method: "mpesa" | "emola") {
  if (!/^[28][234567]\d{7}$/.test(phoneNumber)) return false;
  const operatorDigit = phoneNumber[1];
  const validDigits = method === "mpesa" ? ["4", "5"] : ["6", "7"];
  return validDigits.includes(operatorDigit);
}

/** An event with no tickets, or every ticket priced at 0, reads as free
 * — used both for the hero's CTA label ("Entrar" vs "Bilhetes") and, since
 * 2026-10-12, to decide which attendee-identity step ConnectModal shows
 * (ticket QR code only makes sense once there's actually a paid ticket
 * behind it; see lib/networking/attendeeIdentity.ts). */
export function isEventFree(event: { tickets: { price: number }[] }): boolean {
  return event.tickets.length === 0 || event.tickets.every((ticket) => ticket.price === 0);
}

/** "CC Joaquim Chissano, Maputo" — falls back gracefully when parts are missing. */
export function formatEventLocation(location: {
  name: string;
  address: { city: string } | null;
}) {
  return location.address?.city
    ? `${location.name}, ${location.address.city}`
    : location.name;
}

/**
 * Heuristic only: Pulse doesn't send an explicit "is this live right now"
 * flag (confirmed 2026-09-14 — the stream link just lives at
 * `location.eventLink`), so this checks whether the current time falls
 * inside one of the event's scheduled windows. Interprets `date`+`timeFrom`/
 * `timeTo` in the runtime's local timezone rather than the event's own
 * `timezone` field — close enough for a "show the live indicator" UI touch,
 * not precise enough to gate anything that matters.
 */
export function isEventLiveNow(dates: { date: string; timeFrom: string; timeTo: string }[]) {
  const now = Date.now();
  return dates.some((d) => {
    const day = d.date.slice(0, 10);
    const start = new Date(`${day}T${d.timeFrom}:00`).getTime();
    const end = new Date(`${day}T${d.timeTo}:00`).getTime();
    return now >= start && now <= end;
  });
}

/** "Is the event currently ongoing" for the networking pop-up — broader
 * than `isEventLiveNow` on purpose: that one asks "is a session happening
 * this exact instant" (gaps between sessions count as not-live), this one
 * asks "are we somewhere inside the event's overall span", from its
 * earliest start to its latest end, covering lunch breaks and overnight
 * gaps on a multi-day event too. Null (no usable dates) reads as not
 * ongoing — never show the pop-up on data we can't actually check. */
export function isEventOngoing(dates: { date: string; timeFrom: string; timeTo: string }[]): boolean {
  const start = earliestScheduleStart(dates);
  const end = latestScheduleEnd(dates);
  if (!start || !end) return false;
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

/** Earliest start-moment (date + timeFrom) across every schedule date —
 * the mirror of `latestScheduleEnd`, used together to decide "is the
 * event currently ongoing" for the networking discovery pop-up
 * (2026-10-12: "mostrar apenas enquanto o evento estiver em curso").
 * Same defensive fallback as `latestScheduleEnd` for a missing/bad
 * `timeFrom` (start-of-day, so one broken entry can't NaN-poison the
 * whole Math.min). Null with no usable dates. */
export function earliestScheduleStart(dates: { date: string; timeFrom: string }[]): string | null {
  const starts = dates
    .map((d) => new Date(`${d.date.slice(0, 10)}T${d.timeFrom || "00:00"}:00`).getTime())
    .filter((t) => Number.isFinite(t));
  if (starts.length === 0) return null;
  return new Date(Math.min(...starts)).toISOString();
}

/** Latest end-moment (date + timeTo) across every schedule date — used to
 * default the rating pop-up's window to "opens 1h before the event's own
 * last session ends" when an admin hasn't set one explicitly (see
 * getActiveRatingForm in lib/bff). Null with no usable dates. */
export function latestScheduleEnd(dates: { date: string; timeTo: string }[]): string | null {
  // `timeTo` is occasionally missing/empty on a real session (confirmed
  // live 2026-10-09) — falls back to end-of-day for that one entry rather
  // than let a single bad value NaN-poison Math.max for every date.
  const ends = dates
    .map((d) => new Date(`${d.date.slice(0, 10)}T${d.timeTo || "23:59"}:00`).getTime())
    .filter((t) => Number.isFinite(t));
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends)).toISOString();
}

function youtubeVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtube.com") {
    const id = u.searchParams.get("v");
    if (id) return id;
    const liveMatch = u.pathname.match(/^\/live\/([^/]+)/);
    if (liveMatch) return liveMatch[1];
    return null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id || null;
  }
  return null;
}

/** Organizers paste a plain youtube.com/watch (or youtu.be) URL into
 * `location.eventLink` — YouTube refuses to render that inside an
 * `<iframe>` (X-Frame-Options), so it needs rewriting to the
 * `/embed/VIDEO_ID` form to actually play. Returns null for anything else
 * (Zoom, Facebook Live, a custom page, ...), which isn't safe to assume is
 * iframe-embeddable — callers should fall back to a plain link for those. */
export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** YouTube serves a static cover frame for any video at this well-known
 * path, no API key needed — used so gallery grids can show a real preview
 * instead of a blank color block before the viewer presses play. */
export function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Darkens a `#rrggbb` hex color by `amount` (0–1) — used to derive a
 * hover/active shade from the single accent color an admin picks for an
 * event override, the same way `--brand-red-deep` relates to
 * `--brand-red` in styles/tokens.css. Returns the input unchanged if it
 * isn't a valid 6-digit hex. */
export function darkenHex(hex: string, amount = 0.18): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const num = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const value = (num >> shift) & 0xff;
    return Math.max(0, Math.round(value * (1 - amount)));
  };
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(channel(16))}${toHex(channel(8))}${toHex(channel(0))}`;
}
