import type { PulseSpeakerLink } from "@/lib/pulse/types";
import { getMockChannels } from "./mockChannels";
import type { NetworkingChannelType, SpeakerChannel } from "./types";

/**
 * Turns one of Pulse's real `links[]` entries into a `SpeakerChannel`
 * (2026-10-12). The exact shape of a *populated* entry isn't confirmed
 * yet — every speaker on every event checked so far has `links: []` — so
 * this handles the shapes a backend most plausibly sends and quietly
 * ignores (returns `null` for) anything it doesn't recognize, rather than
 * crashing the page on a guess that turns out wrong. Flagged to confirm
 * once a real populated entry exists to inspect.
 *
 * Only `linkedin`/`whatsapp`/`other` are real channel *types* for
 * networking (unlike the broader icon set `detectSocialLink` in
 * SocialIcons.tsx supports for Partner links) — anything else detected
 * from a URL (YouTube, Instagram, …) still renders, just bucketed as
 * "other" with its hostname as the label.
 */
function typeFromUrl(url: string): { type: NetworkingChannelType; label?: string } | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return null;
  }
  if (host === "linkedin.com") return { type: "linkedin" };
  if (host === "wa.me" || host === "whatsapp.com") return { type: "whatsapp" };
  return { type: "other", label: host };
}

function parseOne(entry: PulseSpeakerLink): SpeakerChannel | null {
  if (typeof entry === "string") return typeFromUrl(entry);

  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const type = obj.type;
    if (type === "linkedin" || type === "whatsapp" || type === "other") {
      return { type, label: typeof obj.label === "string" ? obj.label : undefined };
    }
    const url = obj.url ?? obj.link ?? obj.value;
    if (typeof url === "string") return typeFromUrl(url);
  }

  return null;
}

/** Prefers real Pulse `links` data when the speaker actually has any;
 * falls back to the deterministic mock only while `links` is still empty
 * — so this starts returning real channels automatically the moment an
 * admin fills one in, no code change needed on this side. */
export function getSpeakerChannels(speaker: { name: string; company: string; links?: PulseSpeakerLink[] }): SpeakerChannel[] {
  const real = (speaker.links ?? []).map(parseOne).filter((c): c is SpeakerChannel => c !== null);
  if (real.length > 0) return real;
  return getMockChannels(speaker.name, speaker.company);
}

/** Drop-in replacement for mockChannels.ts's `withMockChannels` — same
 * shape, but channel resolution now goes through `getSpeakerChannels`
 * (real data preferred, mock as fallback) instead of mock-only. Leaves
 * `links` on the returned object (harmless — callers consume `channels`
 * instead) rather than stripping it, so this stays a plain spread. */
export function withResolvedChannels<T extends { name: string; company: string; links?: PulseSpeakerLink[] }>(
  speaker: T,
): T & { channels: SpeakerChannel[] } {
  return { ...speaker, channels: getSpeakerChannels(speaker) };
}
