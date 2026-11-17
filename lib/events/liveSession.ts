import type { Panel } from "@/lib/pulse/panels";

/** Today's date ("YYYY-MM-DD") and minutes since midnight in the event's
 * own timezone — sessions' "07:00"/"07:30" are local event times, so this
 * is right for a visitor in any timezone. */
export function nowInZone(timeZone: string, at: Date = new Date()): { day: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
  } catch {
    return nowInZone("Africa/Maputo", at);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export interface LiveSessions {
  current: Panel | null;
  next: Panel | null;
}

/** What's on right now and what's next, among TODAY's sessions only (null
 * when the event isn't running today, or today's programme is over). */
export function liveSessions(panels: Panel[], timeZone: string, at: Date = new Date()): LiveSessions | null {
  const now = nowInZone(timeZone, at);
  const today = panels
    .filter((p) => p.date?.slice(0, 10) === now.day && toMinutes(p.timeFrom) !== null)
    .sort((a, b) => (toMinutes(a.timeFrom) ?? 0) - (toMinutes(b.timeFrom) ?? 0));
  if (today.length === 0) return null;

  const current =
    today.find((p) => {
      const from = toMinutes(p.timeFrom)!;
      const to = toMinutes(p.timeTo) ?? from + 30;
      return now.minutes >= from && now.minutes < to;
    }) ?? null;
  const next = today.find((p) => (toMinutes(p.timeFrom) ?? 0) > now.minutes && p !== current) ?? null;

  if (!current && !next) return null;
  return { current, next };
}

/** Window event the event cover fires so the Programa jumps to a session. */
export const FOCUS_SESSION_EVENT = "mediacraft:focus-session";

// The Programa only mounts after the tab transition, so the request is also
// parked here and picked up by the Programa when it mounts.
let pendingFocus: string | null = null;

/** Ask the Programa to show one session (now, or as soon as it mounts). */
export function requestSessionFocus(key: string) {
  pendingFocus = key;
  window.dispatchEvent(new CustomEvent(FOCUS_SESSION_EVENT, { detail: key }));
}

/** The parked request, if any — left in place until the Programa has
 * actually applied it (React may mount it twice in development). */
export function peekPendingSessionFocus(): string | null {
  return pendingFocus;
}

export function clearPendingSessionFocus() {
  pendingFocus = null;
}
