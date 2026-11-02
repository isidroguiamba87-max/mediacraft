/**
 * "Networking do Evento" (2026-10-12) — types for the whole feature,
 * matching the API contract from the product/engineering briefs as
 * closely as the real Pulse data allows today. Two things aren't real yet
 * and are called out everywhere they matter:
 *
 * - `speakerId` is actually `speakerSlug(name, company)` (see
 *   lib/pulse/panels.ts) — Pulse has no stable speaker id, same situation
 *   as `Panel.key`.
 * - `SpeakerChannel[]` doesn't exist on Pulse's speaker objects yet (an
 *   admin confirmed, 2026-10-12, that it's being added separately) — see
 *   mockChannels.ts for the stand-in used until then.
 */

/** Fixed list, selection-only — never a free-text field (see ConnectModal). */
export const NETWORKING_REASONS = [
  "negocio",
  "parceria",
  "tema",
  "carreira",
  "investimento",
  "outro",
] as const;
export type NetworkingReason = (typeof NETWORKING_REASONS)[number];

export type NetworkingChannelType = "linkedin" | "whatsapp" | "other";

export interface SpeakerChannel {
  type: NetworkingChannelType;
  /** Shown on the channel-picker button for "other" (e.g. "Instagram",
   * "Site pessoal"); linkedin/whatsapp use their own fixed label. */
  label?: string;
}

export type NetworkingSource = "session" | "speakers_directory";

export interface NetworkingIntentInput {
  eventId: string;
  /** See the module doc comment — this is `speakerSlug(name, company)`. */
  speakerId: string;
  sessionId: string | null;
  source: NetworkingSource;
  connectionReason: NetworkingReason;
  channel: NetworkingChannelType;
  /** Resolved by attendeeIdentity.ts — a ticket QR code (paid events) or a
   * locally-generated id from a name+email capture (free events). Never a
   * JWT: this site has no participant login (see attendeeIdentity.ts). */
  attendeeId: string;
}

export interface NetworkingIntentResult {
  intentId: string;
  /** Where to send the participant after a successful register — comes
   * from the backend by design (the speaker's real channel URL is never
   * exposed client-side). The mock fabricates a plausible one; see
   * mock.ts. */
  redirectUrl: string;
}

export interface NetworkingSourceSplit {
  session: number;
  speakersDirectory: number;
}

export interface NetworkingMetrics {
  intentsTotal: number;
  uniqueAttendees: number;
  speakersWithInterest: number;
  sourceSplit: NetworkingSourceSplit;
  reasonBreakdown: Record<NetworkingReason, number>;
  /** unique attendees who started networking ÷ event attendees × 100 —
   * null when the event's total attendee count isn't available to divide
   * by (Pulse doesn't expose it in the embed endpoints used here). */
  participationRate: number | null;
}

export interface NetworkingSpeakerStat {
  speakerId: string;
  speakerName: string;
  intentsCount: number;
  topReason: NetworkingReason | null;
  sessionTitles: string[];
}
