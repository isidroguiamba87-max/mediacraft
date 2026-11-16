/** "Ao Vivo" (Zoom) details for an event — admin-set in "Visual do Evento"
 * (event_overrides.live_info). Pulse only has the stream link
 * (location.eventLink); everything else lives here. All optional. */
export interface EventLiveInfo {
  /** Overrides / stands in for Pulse's eventLink. */
  joinUrl?: string;
  meetingId?: string;
  passcode?: string;
  chatUrl?: string;
  instructions?: string;
}

const KEYS = ["joinUrl", "meetingId", "passcode", "chatUrl", "instructions"] as const;

/** Keeps only non-empty string fields; null when nothing is set. */
export function cleanLiveInfo(raw: unknown): EventLiveInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const out: EventLiveInfo = {};
  for (const k of KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Which video platform a join link is on — drives the card's wording. */
export type LivePlatform = "zoom" | "meet" | "teams" | "other";

export function livePlatform(link: string): LivePlatform {
  if (/(^|\.)zoom\.us\//i.test(link) || /zoom\.us/i.test(link)) return "zoom";
  if (/meet\.google\.com/i.test(link)) return "meet";
  if (/teams\.(microsoft|live)\.com/i.test(link)) return "teams";
  return "other";
}

/** The meeting ID to show: the admin's, else read off the link —
 * zoom.us/j/84275122896 → "842 7512 2896", meet.google.com/ybu-njjz-sbe →
 * "ybu-njjz-sbe". */
export function zoomMeetingId(info: EventLiveInfo | null, link: string | null): string | null {
  const meetCode = link?.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i)?.[1];
  if (!info?.meetingId && meetCode) return meetCode.toLowerCase();
  const raw = info?.meetingId ?? link?.match(/zoom\.us\/(?:j|wc\/join|s)\/(\d{9,11})/)?.[1] ?? null;
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return raw;
}
