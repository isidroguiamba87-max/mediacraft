import { createClient } from "./server";
import {
  NETWORKING_REASONS,
  type NetworkingMetrics,
  type NetworkingReason,
} from "@/lib/networking/types";

interface NetworkingIntentRow {
  id: string;
  event_id: string;
  speaker_id: string;
  session_id: string | null;
  source: "session" | "speakers_directory";
  connection_reason: NetworkingReason;
  channel: string;
  attendee_id: string;
  created_at: string;
}

export interface NetworkingQueryFilters {
  sessionId?: string;
  from?: string;
  to?: string;
}

/** Admin-only read of this project's own `networking_intents` table
 * (2026-10-12) — real rows written by `addNetworkingIntent` every time a
 * participant completes the Connect funnel, not Pulse data (Pulse has no
 * networking endpoint yet). This is what replaced the Networking page's
 * static example numbers with real, accumulating ones. */
async function queryIntents(eventId: string, filters?: NetworkingQueryFilters): Promise<NetworkingIntentRow[]> {
  const supabase = await createClient();
  let query = supabase.from("networking_intents").select("*").eq("event_id", eventId);
  if (filters?.sessionId) query = query.eq("session_id", filters.sessionId);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", `${filters.to}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;
  return data as NetworkingIntentRow[];
}

export async function getNetworkingMetrics(
  eventId: string,
  filters?: NetworkingQueryFilters,
): Promise<NetworkingMetrics> {
  const rows = await queryIntents(eventId, filters);

  const reasonBreakdown = Object.fromEntries(
    NETWORKING_REASONS.map((r) => [r, rows.filter((row) => row.connection_reason === r).length]),
  ) as Record<NetworkingReason, number>;

  return {
    intentsTotal: rows.length,
    uniqueAttendees: new Set(rows.map((r) => r.attendee_id)).size,
    speakersWithInterest: new Set(rows.map((r) => r.speaker_id)).size,
    sourceSplit: {
      session: rows.filter((r) => r.source === "session").length,
      speakersDirectory: rows.filter((r) => r.source === "speakers_directory").length,
    },
    reasonBreakdown,
    // Not known at this layer — the admin page combines this with Pulse's
    // own ticketsSold to compute a real participation rate instead of
    // always showing "—".
    participationRate: null,
  };
}

export interface SpeakerIntentAggregate {
  speakerId: string;
  intentsCount: number;
  topReason: NetworkingReason | null;
  /** Session *ids*, not titles — titles come from live Pulse data
   * (sessions get renamed, this table only ever stores the stable key),
   * resolved by the admin page against `buildSpeakerDirectory`. */
  sessionIds: string[];
}

export async function getNetworkingBySpeaker(
  eventId: string,
  filters?: NetworkingQueryFilters,
): Promise<SpeakerIntentAggregate[]> {
  const rows = await queryIntents(eventId, filters);

  const bySpeaker = new Map<string, NetworkingIntentRow[]>();
  for (const row of rows) {
    if (!bySpeaker.has(row.speaker_id)) bySpeaker.set(row.speaker_id, []);
    bySpeaker.get(row.speaker_id)!.push(row);
  }

  return [...bySpeaker.entries()].map(([speakerId, speakerRows]) => {
    const reasonCounts = new Map<NetworkingReason, number>();
    for (const row of speakerRows) {
      reasonCounts.set(row.connection_reason, (reasonCounts.get(row.connection_reason) ?? 0) + 1);
    }
    const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const sessionIds = [...new Set(speakerRows.map((r) => r.session_id).filter((s): s is string => !!s))];

    return { speakerId, intentsCount: speakerRows.length, topReason, sessionIds };
  });
}
