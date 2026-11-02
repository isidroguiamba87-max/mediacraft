import type { NetworkingIntentInput, NetworkingIntentResult } from "./types";

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Fabricates a destination since there's no real per-speaker channel URL
 * to send a visitor to yet (2026-10-12) — clearly a placeholder, never
 * shown as the speaker's actual profile. The *registration* itself is
 * real (see lib/bff's addNetworkingIntent) — only the redirect target is
 * mocked here, since Pulse doesn't expose a real one yet either. Logged
 * to the console so a developer testing the funnel can see what the
 * fallback picked, without a real backend to inspect. */
export function createNetworkingIntentMock(input: NetworkingIntentInput): NetworkingIntentResult {
  console.info("[networking mock] redirect fallback", input);

  const redirectUrl =
    input.channel === "whatsapp"
      ? "https://wa.me/258840000000"
      : input.channel === "linkedin"
        ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(input.speakerId)}`
        : "https://example.com";

  return { intentId: randomId("int"), redirectUrl };
}
