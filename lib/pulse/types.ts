/** Every Pulse API response is wrapped in this envelope: `{code, success,
 * payload}`. On success `payload` is the resource (type `T`); on error
 * (confirmed reading `server-new/src/middlewares/error.middleware.ts`)
 * `payload` is instead `{message, errors?}` — `message` IS a real,
 * already-translated (pt/en via fastify-i18n, no fr — falls back to pt)
 * string, contrary to an earlier assumption that the envelope carried no
 * message at all. `code` (e.g. `E-501`) is the stable identifier from
 * `server-new/src/codes/base.ts`; `message` is fine to show directly to
 * the participant, `code` is for logs/branching. */
export interface PulseEnvelope<T> {
  code: string;
  success: boolean;
  payload: T;
}

export interface PulseErrorPayload {
  message: string;
  errors?: { field?: string; message: string }[];
}

export interface PulseScheduleDate {
  id: string;
  date: string; // ISO
  timeFrom: string;
  timeTo: string;
}

export interface PulseEventAddress {
  avenue: string;
  city: string;
  province: string;
}

export interface PulseEventLocation {
  platform: string;
  name: string;
  mapLink: string | null;
  /** Live-stream / online meeting link, when the event has one — this is
   * what the "Ao Vivo" tab renders. Nullable; only present once an
   * organizer sets it in Pulse Admin. */
  eventLink: string | null;
  providerName: string | null;
  address: PulseEventAddress | null;
}

/** Confirmed directly from `server-new/src` Prisma schema/repositories
 * (2026-09-14, reading the actual Pulse backend source on this machine —
 * ground truth, not the chat answers, which described a `TicketAreas`
 * enum and route paths that turned out not to match the running code). */
export type TicketArea = "NORMAL" | "VIP";
export type TicketState = "ACTIVE" | "INACTIVE" | "SOLD_OUT";

/** Ticket as it appears on the events LIST (GET /embed/:domain/events —
 * confirmed live 2026-09-18, the route finally deployed to staging). Has
 * `id`/`state` (unlike the old `/participants/events/public` list, which
 * didn't) — still no `area`/`quantity`, fetch the event detail for that. */
export interface PulseEventListTicket {
  id: string;
  title: string;
  price: number;
  state: TicketState;
  details: string;
}

/** Ticket as it appears on the event DETAIL
 * (GET /participants/events/public/:eventId). */
export interface PulseEventTicket {
  id: string;
  title: string;
  price: number;
  details: string;
  area: TicketArea;
  state: TicketState;
  quantity: number;
  quantitySold: number;
  perRequestMinimum: number;
  perRequestMaximum: number;
}

/**
 * One item from GET /embed/:domain/events — confirmed LIVE 2026-09-18
 * against staging (`api.devpulsemz.cloud`) with a real MediaCraft event,
 * after the route sat 404 for days and then just started working (no
 * code change on our side made that happen — it was deployed on their
 * end). NOT yet confirmed reachable on production (`api.pulse.co.mz`
 * still 404s this route as of the same date) — keep an eye out.
 *
 * This route is domain-scoped SERVER-SIDE (only returns events created
 * under the organizer whose account matches the `:domain` path segment,
 * confirmed by only ever seeing MediaCraft's own event here even though
 * other organizers' events exist on the platform) — no client-side
 * `createdById` filtering needed anymore, and indeed this payload doesn't
 * even carry a `createdById` field to filter by.
 *
 * No `category`/`slug`/`status` field — there's still no category to
 * filter/badge by. Real `isFree`/`isSoldOut` booleans ARE present now
 * (computed server-side), so `EventCard` no longer needs to derive "free"
 * from `tickets.every(t => t.price === 0)`.
 */
export interface PulseEvent {
  id: string;
  title: string;
  details: string;
  coverUrl: string;
  presentationUrl: string | null;
  timezone: string;
  ageLimit: number;
  wheelchairAccess: boolean;
  scheduleDates: PulseScheduleDate[];
  location: PulseEventLocation;
  tickets: PulseEventListTicket[];
  organizedBy: PulseOrganizedBy;
  isFree: boolean;
  isSoldOut: boolean;
  createdAt: string; // ISO
}

/** A speaker's own contact link (2026-10-12) — confirmed live on both
 * `event.speakers[]` and `sections[].sessions[].speakers[]`, but every
 * speaker on every event checked so far has an empty `links: []`, so the
 * shape of a *populated* entry isn't confirmed yet. Typed loosely
 * (`unknown`) on purpose until a real one shows up to inspect — see
 * lib/networking/parseChannels.ts, which parses defensively and simply
 * ignores anything it doesn't recognize rather than crashing on a guess
 * that turns out wrong. */
export type PulseSpeakerLink = unknown;

export interface PulseEventSpeaker {
  name: string;
  photoUrl: string | null;
  company: string;
  occupation: string;
  photoOriginalName: string | null;
  phoneNumber: string | null;
  links: PulseSpeakerLink[];
}

export interface PulseSessionRoom {
  /** Present on staging, confirmed MISSING (key absent, not null) on a
   * real production event 2026-09-16 (`BFSI MOZAMBIQUE 2026`) — treat as
   * unreliable, never use as a React key alone. */
  id?: string;
  capacity: number;
  title: string;
}

export interface PulseSessionSpeaker {
  /** See `PulseSessionRoom.id` — same unreliability confirmed live. */
  id?: string;
  company: string;
  name: string;
  occupation: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  links: PulseSpeakerLink[];
}

export interface PulseSession {
  /** Present on staging, confirmed MISSING (key absent, not null) on a
   * real production event 2026-09-16 (`BFSI MOZAMBIQUE 2026`, every
   * session) — production may be running different code than
   * `E:\Pulse\server-new`'s local checkout, which unconditionally
   * `select`s `id: true` here. Never rely on this being present; always
   * have a fallback React key. */
  id?: string;
  date: string; // ISO
  description: string;
  timeFrom: string;
  timeTo: string;
  title: string;
  rooms: PulseSessionRoom[];
  speakers: PulseSessionSpeaker[];
}

/** One agenda block (`AgendaSection` -> `sections[]` on the event detail),
 * e.g. "Dia 1" grouping several sessions. Confirmed: no separate agenda
 * route — this is the whole program. */
export interface PulseEventSection {
  title: string;
  sessions: PulseSession[];
}

export interface PulsePartnership {
  link: string | null;
  name: string;
  logoUrl: string;
  caption: string;
}

export interface PulsePartnershipSection {
  title: string;
  partnerships: PulsePartnership[];
}

export interface PulseOrganizedBy {
  name?: string;
  description?: string;
  phone?: string | null;
  mail?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
}

/** `type`/`subType` here are the closest thing Pulse has to an event
 * category, but they only exist on the detail payload (not the list) and
 * their possible values weren't given to us — treat as opaque strings,
 * don't map them through the old events.categories i18n namespace. */
export interface PulsePublishConfig {
  private?: boolean;
  type?: string;
  subType?: string | null;
}

/** $Enums.ElementType on the Pulse side — exact values not given to us. */
export type FormElementType = string;

export interface PulseFormListValue {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  value: string;
  elementId: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PulseFormElement {
  id: string;
  createdAt: string;
  updatedAt: string;
  formId: string;
  caption: string | null;
  key: string;
  placeholder: string | null;
  defaultValue: string | null;
  settings: unknown;
  isRequired: boolean;
  orderIndex: number;
  elementType: FormElementType;
  listValues: PulseFormListValue[];
}

/** One custom registration form, scoped to a ticket (`ticketId: null` =
 * applies to all tickets). Rendering these dynamically is a separate,
 * not-yet-built piece of work — see the memory note. */
export interface PulseEventForm {
  ticketId: string | null;
  elements: PulseFormElement[];
}

/**
 * GET /embed/:domain/events/:eventId payload. `isMaterialPublic` WAS
 * wrongly marked here as "a chat-answer guess that doesn't exist" — that
 * was from reading the wrong local backend checkout (see the memory
 * note); confirmed live 2026-09-18 it's a real field (`false` on the
 * "Rotas de Moz" test event). When `true`, the Biblioteca tab shows
 * materials straight away with no ticket-code gate; when `false`, it
 * keeps asking for a `qrCode` the way `getEventMaterials` already
 * expects. `scheduleDates` here is always filtered to `date >= now` by
 * the repository, so a past event's detail can come back with an empty
 * array.
 */
export interface PulseEventDetail {
  id: string;
  cover: string | null;
  coverUrl: string | null;
  presentationUrl: string | null;
  title: string;
  details: string;
  timezone: string;
  ageLimit: number;
  wheelchairAccess: boolean;
  partnershipSections: PulsePartnershipSection[];
  location: PulseEventLocation;
  scheduleDates: PulseScheduleDate[];
  speakers: PulseEventSpeaker[];
  sections: PulseEventSection[];
  tickets: PulseEventTicket[];
  publishConfig: PulsePublishConfig;
  organizedBy: PulseOrganizedBy;
  form: PulseEventForm[];
  isMaterialPublic: boolean;
}

/** Body for POST /participants/events/:eventId/enroll/reservation.
 * Confirmed against `validations/participant/enroll.validation.ts`
 * `reservationSchema` and `controllers/participant/enroll.controller.ts`:
 * `email`/`firstName`/`lastName`/`phoneNumber` are optional in the zod
 * schema but the controller manually 422s if they're missing on the
 * anonymous (`?auth=false`) path — so treat them as required whenever
 * `authenticated` is false. `phoneNumber` here (the participant's contact
 * number) has NO regex — only the payment endpoint's `phoneNumber`
 * (mobile-money number) is regex-validated. */
export interface ReservationTicketInput {
  /** cuid of a `PulseEventTicket.id` from the event detail — list tickets
   * have no id and can't be reserved directly. */
  ticketId: string;
  quantity: number;
}

export interface ReserveTicketInput {
  eventId: string;
  /** Drives the `?auth=` query param (sent as literal "true"/"false").
   * Pass true (with `token`) once a signed-in participant flow exists;
   * false runs the anonymous/guest path, which requires the contact
   * fields below. */
  authenticated: boolean;
  token?: string;
  /** Site locale — forwarded as `Accept-Language` so a validation error
   * comes back translated. */
  locale?: string;
  tickets: ReservationTicketInput[];
  /** cuids from the event detail's `scheduleDates[]` — which date(s) the
   * participant is registering for. */
  dateIds: string[];
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: "M" | "F" | "OTHER";
  /** ISO date string, per the zod schema. */
  birthDate?: string;
}

/** Response payload for the anonymous/guest reservation path (the only
 * one this site uses — no participant login here). Confirmed from
 * `enroll.controller.ts` (`payload: {...reservation}`, spreading
 * `ticketLogicRepository.reserveTickets`'s `{id, totalPrice, expiresAt}`
 * return type verbatim). Note: the AUTHENTICATED path renames this same
 * field to `reservationId` instead of `id` — an inconsistency in the
 * real API, irrelevant to us since we never send `auth=true`. */
export interface PulseReservation {
  id: string;
  totalPrice: number;
  expiresAt: string; // ISO
}

/** Body for POST .../enroll/reservation/:reservationId/payment —
 * confirmed against `validations/participant/enroll.validation.ts`
 * `paySchema`. Only required when the reservation's `totalPrice > 0`
 * (server 402s otherwise if `method`/`phoneNumber` are missing).
 * `phoneNumber` must match `mozambiqueNationalNumberRegex`
 * (`/^[28][234567]\d{7}$/`) AND start with 84/85 for `mpesa`, 86/87 for
 * `emola` — validated client-side too, see `isValidMobileMoneyNumber`.
 * `answers` is for the event's custom registration form (`PulseEventForm`)
 * — confirmed shape from `custom-forms.validation.ts formAnswerSchema`. */
export interface FormAnswerInput {
  elementId: string;
  value: unknown;
}

export interface PayReservationInput {
  eventId: string;
  reservationId: string;
  token?: string;
  locale?: string;
  method?: "mpesa" | "emola";
  phoneNumber?: string;
  answers?: FormAnswerInput[];
}

/** Response shape: `{ enrollments: string[] }` — one `qrCode` per
 * `Registration`/ticket created. Automatic email delivery of the ticket
 * PDF (with the QR embedded) is confirmed by MediaCraft themselves
 * (2026-09-18, from their own use of Pulse — not from a live payment on
 * this site, every real attempt so far has 402'd before reaching this
 * response). There's no separate "fetch my ticket" endpoint for us to
 * call, so `enrollments` is also rendered as an on-screen QR right after
 * payment (see Tickets.tsx) as a safety net in case an email is delayed,
 * lost, or goes to spam. */
export interface PulsePaymentResult {
  enrollments: string[];
}

/** GET /participants/events/:eventId/materials item. Confirmed route:
 * query param is `qrCode` (not `ticketCode`), and there is NO
 * `/materials/:sessionId` sub-route — `participant/materials.routes.ts`
 * only registers `GET /`. Payload wrapper confirmed
 * (`material.controller.ts`: `payload: { materials }`); the per-item
 * field names themselves weren't traced down to the `FileInfo` Prisma
 * model, so these are still a placeholder. */
export interface PulseMaterial {
  id: string;
  eventId: string;
  title: string;
  type?: string;
  url: string;
}

/** Thrown by the Pulse client. Callers should branch on `code`, never on
 * a `message` (the envelope doesn't carry one — see PulseEnvelope). */
export class PulseApiError extends Error {
  code: string;
  status: number;

  /** `message` is the backend's own translated text
   * (`payload.message`) when the envelope carried one — safe to show
   * directly to the participant. Falls back to `code` when absent (e.g.
   * a network failure with no JSON body at all). */
  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.name = "PulseApiError";
    this.code = code;
    this.status = status;
  }
}
