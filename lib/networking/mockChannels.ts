import { speakerSlug } from "@/lib/pulse/panels";
import type { SpeakerChannel } from "./types";

/**
 * Stand-in for a speaker's channels when Pulse's real `links[]` is empty
 * (2026-10-12) — used by `getSpeakerChannels` in parseChannels.ts, which
 * prefers real data and only falls back to this. Deterministic from
 * name+company — same speaker always gets the same mock channels across
 * renders/visits, rather than reshuffling every page load, which would
 * make the funnel look broken.
 *
 * Deliberately covers all three real-world cases so the "no Connect
 * button without a channel" rule (and the "channel step isn't skipped
 * even with just one" rule) both get exercised during development:
 * ~1/4 of speakers get no channels at all, ~1/4 get only WhatsApp, ~1/4
 * only LinkedIn, ~1/4 both. Safe to delete once every event's speakers
 * have real links filled in.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getMockChannels(name: string, company: string): SpeakerChannel[] {
  const bucket = hashString(speakerSlug(name, company)) % 4;
  if (bucket === 0) return [];
  const channels: SpeakerChannel[] = [];
  if (bucket !== 1) channels.push({ type: "linkedin" });
  if (bucket !== 2) channels.push({ type: "whatsapp" });
  return channels;
}
