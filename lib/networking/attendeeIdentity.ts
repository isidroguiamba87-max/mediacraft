"use client";

import { getEventMaterials } from "@/lib/pulse/endpoints";

/**
 * How we know who's clicking Connect, on a site with no participant login
 * (2026-10-12 — see the FASE 0 discussion: the engineering brief assumes
 * a Bearer JWT that doesn't exist here). Resolved per-event, two ways:
 *
 * - Paid event: the participant already has a ticket QR code from
 *   reserving it — validated the same way the Biblioteca tab already
 *   validates one (`getEventMaterials` with `qrCode`, same `locked`/
 *   `error` shape), then used as-is as the attendee id.
 * - Free event: no ticket code to reuse, so ConnectModal asks for name +
 *   email once (the same contact fields `reserveTicket` already collects
 *   for an unauthenticated reservation) and a local id is derived from
 *   that. Not a real identity — good enough to count "unique attendees"
 *   on one device for one event, same trust level as everything else
 *   this anonymous, no-login public site tracks client-side.
 *
 * Either way, resolved once per event and cached in localStorage so a
 * participant is never asked twice (2026-10-12: "permitir várias
 * intenções... mantendo o contexto").
 */

function storageKey(eventId: string) {
  return `pulse:attendee_id:${eventId}`;
}

export function getStoredAttendeeId(eventId: string): string | null {
  try {
    return localStorage.getItem(storageKey(eventId));
  } catch {
    return null;
  }
}

function storeAttendeeId(eventId: string, id: string) {
  try {
    localStorage.setItem(storageKey(eventId), id);
  } catch {
    // Private browsing or storage disabled — ConnectModal just asks again
    // next time; nothing else depends on this write succeeding.
  }
}

export function clearStoredAttendeeId(eventId: string) {
  try {
    localStorage.removeItem(storageKey(eventId));
  } catch {
    // Nothing to clean up if storage isn't available.
  }
}

/** Paid-event path. Returns the attendee id on a valid code, or an error
 * reason to show inline — never throws, same defensive shape as
 * `getEventMaterials` itself. */
export async function resolveAttendeeIdViaQrCode(
  eventId: string,
  qrCode: string,
): Promise<{ attendeeId: string } | { error: "invalid" | "unknown" }> {
  const trimmed = qrCode.trim();
  if (!trimmed) return { error: "invalid" };

  const result = await getEventMaterials(eventId, { qrCode: trimmed });
  if (result.locked) return { error: "invalid" };
  if (result.error) return { error: "unknown" };

  storeAttendeeId(eventId, `qr:${trimmed}`);
  return { attendeeId: `qr:${trimmed}` };
}

/** Free-event path — no backend round-trip, just a stable local id from
 * whatever contact details the participant gives. Email preferred (most
 * likely to be stable/unique for the same person); falls back to a random
 * id scoped to this browser when no email is given. */
export function resolveAttendeeIdFromContact(eventId: string, name: string, email: string): string {
  const base = email.trim().toLowerCase() || `${name.trim().toLowerCase()}:${crypto.randomUUID()}`;
  const attendeeId = `contact:${base}`;
  storeAttendeeId(eventId, attendeeId);
  return attendeeId;
}
