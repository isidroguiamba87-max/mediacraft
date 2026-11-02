import { pulseConfig } from "@/config/site.config";
import { pulse } from "./client";
import { PulseApiError } from "./types";
import type {
  PayReservationInput,
  PulseEvent,
  PulseEventDetail,
  PulseMaterial,
  PulsePaymentResult,
  PulseReservation,
  ReserveTicketInput,
} from "./types";

/**
 * Local fallback data, used ONLY when the Pulse API can't be reached. This
 * keeps every page navigable with realistic placeholders during
 * development. Shape matches `GET /embed/:domain/events` (confirmed live
 * 2026-09-18) — see lib/pulse/types.ts.
 */
function cover(unsplashId: string) {
  return `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=1200&q=70`;
}

function mockLocation(name: string, city: string): PulseEvent["location"] {
  return {
    platform: "presencial",
    name,
    mapLink: null,
    eventLink: null,
    providerName: null,
    address: { avenue: name, city, province: city },
  };
}

function mockDates(...isoDates: string[]) {
  return isoDates.map((date, i) => ({
    id: `mock-date-${date}-${i}`,
    date,
    timeFrom: "09:00",
    timeTo: "17:00",
  }));
}

const MOCK_ORGANIZED_BY = { name: "MediaCraft" };

const MOCK_EVENTS: PulseEvent[] = [
  {
    id: "mock-1",
    title: "Fórum de Diplomacia, Turismo & Investimento 2026",
    details:
      "Dois dias de conferências e painéis que reúnem diplomatas, investidores e o sector do turismo para debater o futuro económico de Moçambique e da região.",
    coverUrl: cover("1540575467063-178a50c2df87"),
    presentationUrl: null,
    timezone: "Africa/Maputo",
    ageLimit: 18,
    wheelchairAccess: true,
    scheduleDates: mockDates("2026-10-14", "2026-10-15"),
    location: mockLocation("CC Joaquim Chissano", "Maputo"),
    tickets: [
      { id: "mock-1-t1", title: "Visitante", price: 0, state: "ACTIVE", details: "Área de exposição, programa público" },
      { id: "mock-1-t2", title: "Delegado", price: 2500, state: "ACTIVE", details: "Todas as sessões, certificado, materiais, almoço" },
    ],
    organizedBy: MOCK_ORGANIZED_BY,
    isFree: false,
    isSoldOut: false,
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "mock-2",
    title: "Retiro Executivo BCI",
    details: "Retiro privado de liderança para a equipa executiva do BCI.",
    coverUrl: cover("1519671482749-fd09be7ccebf"),
    presentationUrl: null,
    timezone: "Africa/Maputo",
    ageLimit: 18,
    wheelchairAccess: false,
    scheduleDates: mockDates("2026-11-05"),
    location: mockLocation("Bilene Lodge", "Bilene"),
    tickets: [{ id: "mock-2-t1", title: "Delegado", price: 0, state: "ACTIVE", details: "Acesso ao retiro" }],
    organizedBy: MOCK_ORGANIZED_BY,
    isFree: true,
    isSoldOut: false,
    createdAt: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "mock-3",
    title: "Intra Africa Coffee & Chocolate Week",
    details: "Feira e conferência sobre café e chocolate africanos.",
    coverUrl: cover("1447933601403-0c6688de566e"),
    presentationUrl: null,
    timezone: "Africa/Maputo",
    ageLimit: 0,
    wheelchairAccess: true,
    scheduleDates: mockDates("2026-12-02"),
    location: mockLocation("Centro de Feiras", "Maputo"),
    tickets: [{ id: "mock-3-t1", title: "Entrada geral", price: 500, state: "ACTIVE", details: "Acesso à feira" }],
    organizedBy: MOCK_ORGANIZED_BY,
    isFree: false,
    isSoldOut: false,
    createdAt: "2026-06-20T09:00:00.000Z",
  },
  {
    id: "mock-4",
    title: "Conferência Lusófona de Comunicação",
    details: "Encontro anual de profissionais de comunicação lusófonos.",
    coverUrl: cover("1475721027785-f74eccf877e2"),
    presentationUrl: null,
    timezone: "Africa/Maputo",
    ageLimit: 0,
    wheelchairAccess: true,
    scheduleDates: mockDates("2026-04-18"),
    location: mockLocation("Hotel Cardoso", "Maputo"),
    tickets: [{ id: "mock-4-t1", title: "Geral", price: 0, state: "ACTIVE", details: "Entrada livre" }],
    organizedBy: MOCK_ORGANIZED_BY,
    isFree: true,
    isSoldOut: false,
    createdAt: "2026-02-01T09:00:00.000Z",
  },
];

function findMockEvent(eventId: string): PulseEventDetail | undefined {
  const base = MOCK_EVENTS.find((e) => e.id === eventId);
  if (!base) return undefined;
  return {
    id: base.id,
    cover: null,
    coverUrl: base.coverUrl,
    presentationUrl: base.presentationUrl,
    title: base.title,
    details: base.details,
    timezone: base.timezone,
    ageLimit: base.ageLimit,
    wheelchairAccess: base.wheelchairAccess,
    partnershipSections: [],
    location: base.location,
    scheduleDates: base.scheduleDates,
    speakers: [],
    sections: [],
    tickets: base.tickets.map((t) => ({
      ...t,
      area: "NORMAL",
      quantity: 100,
      quantitySold: 20,
      perRequestMinimum: 1,
      perRequestMaximum: 10,
    })),
    publishConfig: {},
    organizedBy: base.organizedBy,
    form: [],
    isMaterialPublic: false,
  };
}

/** Confirmed live 2026-09-18: `/embed/:domain/events` really does support
 * `status=upcoming|past|all` (unlike the old `/participants/events/public`
 * fallback, which silently treated anything but "upcoming" as "past"). */
export type EventPeriod = "upcoming" | "past" | "all";

export interface GetPublicEventsParams {
  status?: EventPeriod;
  cursor?: string;
}

/**
 * Public event listing via GET /embed/:domain/events — confirmed live
 * 2026-09-18 on staging (`api.devpulsemz.cloud`), domain-scoped
 * server-side to `pulseConfig.domain` (only ever returns MediaCraft's own
 * events, even though other organizers' public events exist on the same
 * platform — no client-side organizer filtering needed anymore). NOT yet
 * confirmed on production (`api.pulse.co.mz` still 404s this route as of
 * the same date) — falls back to local placeholder events if Pulse is
 * unreachable, so the site stays navigable either way.
 */
export async function getPublicEvents(
  params: GetPublicEventsParams = {},
): Promise<{ events: PulseEvent[]; usedFallback: boolean }> {
  const status = params.status ?? "all";
  const search = new URLSearchParams({ status });
  if (params.cursor) search.set("cursor", params.cursor);
  try {
    const { events } = await pulse<{ events: PulseEvent[]; nextCursor: string | null }>(
      `/embed/${pulseConfig.domain}/events?${search.toString()}`,
      { next: { revalidate: 60 } },
    );
    return { events, usedFallback: false };
  } catch (err) {
    // Logged (not just silently swallowed) so a genuine Pulse outage shows
    // up in Vercel's runtime logs instead of looking identical to "Pulse
    // not running yet" during local dev.
    console.error("[pulse] getPublicEvents failed, falling back to mock data:", err);
    return { events: filterByStatus(MOCK_EVENTS, params.status), usedFallback: true };
  }
}

function filterByStatus(events: PulseEvent[], status?: EventPeriod) {
  if (!status || status === "all") return events;
  const now = Date.now();
  return events.filter((e) => {
    const isPast = e.scheduleDates.every((d) => new Date(d.date).getTime() < now);
    return status === "past" ? isPast : !isPast;
  });
}

/**
 * GET /embed/:domain/events/:eventId — confirmed live 2026-09-18, same
 * deployment as the list route above. Full detail: agenda (`sections`),
 * organizer (`organizedBy`), partners (`partnershipSections`), tickets,
 * custom registration `form`, speakers — domain-scoped the same way as
 * the list, so no extra client-side check needed.
 */
export async function getEvent(
  eventId: string,
): Promise<{ event: PulseEventDetail | null; usedFallback: boolean }> {
  try {
    const { event } = await pulse<{ event: PulseEventDetail }>(
      `/embed/${pulseConfig.domain}/events/${eventId}`,
      { next: { revalidate: 60 } },
    );
    return { event, usedFallback: false };
  } catch (err) {
    console.error(`[pulse] getEvent(${eventId}) failed, falling back to mock data:`, err);
    return { event: findMockEvent(eventId) ?? null, usedFallback: true };
  }
}

/**
 * POST /participants/events/:eventId/enroll/reservation?auth=true|false —
 * auth is "condicional": pass `authenticated: true` + `token` for a
 * signed-in participant, or `authenticated: false` with the contact
 * fields (email/firstName/lastName/phoneNumber) required, since there's
 * no participant login on mediacraft-website (that flow lives in the
 * separate `participantes` Pulse app).
 */
export function reserveTicket(input: ReserveTicketInput) {
  const { eventId, authenticated, token, locale, ...body } = input;
  return pulse<PulseReservation>(
    `/participants/events/${eventId}/enroll/reservation?auth=${authenticated}`,
    { method: "POST", body, token, locale },
  );
}

/**
 * POST /participants/events/:eventId/enroll/reservation/:reservationId/payment
 * Only needed when the reservation's totalPrice > 0. This call is
 * effectively long-running — Pulse's own backend polls the mobile-money
 * gateway (Imali) internally before responding — so callers should show a
 * "processing" state and use a generous timeout rather than building
 * their own client-side poll loop.
 */
export function payReservation(input: PayReservationInput) {
  const { eventId, reservationId, token, locale, ...body } = input;
  return pulse<PulsePaymentResult>(
    `/participants/events/${eventId}/enroll/reservation/${reservationId}/payment`,
    { method: "POST", body, token, locale },
  );
}

/** Result of a materials fetch — `locked` (the real `E-109
 * QR_CODE_NEEDED` business error) means "ask for a ticket code", which is
 * a normal, expected state and NOT the same as `error` (an actual failure
 * — wrong code, API unreachable, etc). Callers must not render one as the
 * other, and must never invent placeholder materials for either case. */
export interface MaterialsResult {
  materials: PulseMaterial[];
  locked: boolean;
  error: string | null;
}

/** GET /participants/events/:eventId/materials?qrCode=... — for a private
 * event, access is gated by the participant's ticket QR code (query param
 * `qrCode`), not a bearer token. Confirmed live 2026-09-18: without a
 * qrCode on a private event this 403s with `{code:"E-109", payload:
 * {message:"QR_CODE_NEEDED"}}` — a real business error (not a 404), so
 * the route is genuinely there, just permission-gated as documented. */
export async function getEventMaterials(
  eventId: string,
  options: { qrCode?: string } = {},
): Promise<MaterialsResult> {
  const search = options.qrCode ? `?qrCode=${encodeURIComponent(options.qrCode)}` : "";
  try {
    const { materials } = await pulse<{ materials: PulseMaterial[] }>(
      `/participants/events/${eventId}/materials${search}`,
      { next: { revalidate: 60 } },
    );
    return { materials, locked: false, error: null };
  } catch (err) {
    if (err instanceof PulseApiError && err.code === "E-109") {
      return { materials: [], locked: true, error: null };
    }
    return { materials: [], locked: false, error: err instanceof PulseApiError ? err.message : "unknown" };
  }
}

/** GET /participants/events/:eventId/materials/:sessionId?qrCode=... —
 * materials scoped to one session. Confirmed live 2026-09-18: hitting
 * this with a made-up sessionId (and no qrCode) returns the same real
 * `QR_CODE_NEEDED` business error as `getEventMaterials`, not a 404 —
 * meaning the route is genuinely registered. Not yet wired into any UI. */
export async function getSessionMaterials(
  eventId: string,
  sessionId: string,
  options: { qrCode?: string } = {},
): Promise<MaterialsResult> {
  const search = options.qrCode ? `?qrCode=${encodeURIComponent(options.qrCode)}` : "";
  try {
    const { materials } = await pulse<{ materials: PulseMaterial[] }>(
      `/participants/events/${eventId}/materials/${sessionId}${search}`,
      { next: { revalidate: 60 } },
    );
    return { materials, locked: false, error: null };
  } catch (err) {
    if (err instanceof PulseApiError && err.code === "E-109") {
      return { materials: [], locked: true, error: null };
    }
    return { materials: [], locked: false, error: err instanceof PulseApiError ? err.message : "unknown" };
  }
}
