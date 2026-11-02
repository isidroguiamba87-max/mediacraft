import { pulse } from "@/lib/pulse/client";
import { PulseApiError } from "@/lib/pulse/types";
import { createNetworkingIntentMock } from "./mock";
import type { NetworkingIntentInput, NetworkingIntentResult } from "./types";

/**
 * Registering a networking intent (2026-10-12) has two genuinely separate
 * halves now:
 *
 * 1. **Durable record** — POSTs to our own `/api/bff/networking/intents`,
 *    which writes a real row to this project's own Supabase (see
 *    lib/bff's `addNetworkingIntent` and lib/supabase/networkingIntents.ts
 *    for the admin-side aggregation that reads it back). This is what the
 *    admin's Networking page shows — real, accumulating numbers, not the
 *    static example data it shipped with ("esses dados aí estão
 *    falsos... podes usar dados reais"). Must succeed before anything
 *    else: if it throws, ConnectModal shows the retry UI and nothing
 *    opens (Option A, 2026-10-12: "nunca redireccionar sem registo
 *    confirmado").
 * 2. **Where to redirect** — Pulse's own `/events/:id/networking-intents`
 *    doesn't exist yet either, so this tries it anyway (ready to pick up
 *    a real speaker channel URL the moment it ships) and falls back to a
 *    clearly-fake placeholder destination otherwise (see mock.ts). A
 *    failure here no longer means "registration didn't happen" — that's
 *    already confirmed by step 1 — so any error falls back to the mock,
 *    not just a 404.
 */
export async function createNetworkingIntent(
  input: NetworkingIntentInput,
): Promise<NetworkingIntentResult> {
  const persisted = await fetch("/api/bff/networking/intents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: input.eventId,
      speakerId: input.speakerId,
      sessionId: input.sessionId,
      source: input.source,
      connectionReason: input.connectionReason,
      channel: input.channel,
      attendeeId: input.attendeeId,
    }),
  });
  if (!persisted.ok) {
    throw new Error("Failed to persist networking intent");
  }

  try {
    return await pulse<NetworkingIntentResult>(`/events/${input.eventId}/networking-intents`, {
      method: "POST",
      body: {
        speaker_id: input.speakerId,
        session_id: input.sessionId,
        source: input.source,
        connection_reason: input.connectionReason,
        channel: input.channel,
        attendee_id: input.attendeeId,
      },
    });
  } catch {
    return createNetworkingIntentMock(input);
  }
}

export { PulseApiError };
