/**
 * Static demo content for the Pulse console (app/[locale]/pulse). This is
 * a UI simulation only — none of it is wired to a real backend. Like the
 * event data in lib/pulse/endpoints.ts, table/feed content here is
 * treated as content (not UI chrome) and isn't translated per-locale;
 * only the console's labels (messages/*.json -> "pulse") are.
 *
 * Swap this out once the real Pulse admin API/console exists.
 */

export const DASHBOARD_KPIS = {
  registered: 847,
  registeredDelta: "+12%",
  checkinsToday: 612,
  checkinsRate: "72%",
  questionsPending: 7,
  questionsTotal: 23,
  revenue: "1.2M",
  ticketsSold: 262,
};

export const WEEKLY_REGISTRATIONS = [
  { label: "S1", value: 112 },
  { label: "S2", value: 168 },
  { label: "S3", value: 131 },
  { label: "S4", value: 214 },
  { label: "S5", value: 268 },
  { label: "S6", value: 312 },
  { label: "S7", value: 190 },
];

export const ACTIVITY_FEED = [
  { id: "a1", text: "87 check-ins na última hora.", time: "2 min", tone: "green" as const },
  { id: "a2", text: "Nova foto publicada na galeria ao vivo.", time: "6 min", tone: "orange" as const },
  { id: "a3", text: "Painel de Turismo iniciou transmissão.", time: "12 min", tone: "blue" as const },
  { id: "a4", text: "42 novos bilhetes Delegado vendidos.", time: "20 min", tone: "green" as const },
];

export const TODAY_SESSIONS = [
  { id: "s1", session: "Painel: Turismo como Motor de Investimento", room: "Índico", status: "live" as const, checkin: "218 / 300" },
  { id: "s2", session: "Keynote: Diplomacia Económica", room: "Auditório", status: "scheduled" as const, time: "14:30", checkin: "—" },
  { id: "s3", session: "Sessão de Abertura", room: "Auditório", status: "done" as const, checkin: "431 / 500" },
];

export const ALERTS = [
  { id: "al1", text: "3 novas perguntas para Teresa Machel aguardam resposta.", meta: "Painel: Turismo · 2 min" },
  { id: "al2", text: "Keynote com 5 perguntas pendentes há 8 min.", meta: "Keynote Diplomacia · 8 min" },
];

export const ATTENDANCE_BY_DAY = [
  { day: "day1", present: 431, total: 500 },
  { day: "day2", present: 318, total: 500 },
];

export const ADMIN_EVENTS = [
  { id: "mock-1", title: "Fórum de Diplomacia, Turismo & Investimento 2026", date: "14–15 Mai", category: "forum", visibility: "public" as const, registrations: 847 },
  { id: "mock-2", title: "Retiro Executivo BCI", date: "20 Mai", category: "workshop", visibility: "private" as const, registrations: 64 },
  { id: "mock-3", title: "Intra Africa Coffee & Chocolate Week", date: "02 Jun", category: "conference", visibility: "public" as const, registrations: 203 },
  { id: "mock-4", title: "Conferência Lusófona de Comunicação", date: "18 Abr", category: "conference", visibility: "public" as const, registrations: 512 },
];

export const COMMS_HISTORY = [
  { id: "c1", type: "Convite", recipients: 847, status: "sent" as const },
  { id: "c2", type: "Carta de credenciação", recipients: 612, status: "sent" as const },
  { id: "c3", type: "Lembrete", recipients: 235, status: "scheduled" as const },
];

export const QA_MODERATION = [
  { id: "q1", panel: "Turismo como Motor", panelist: "Teresa Machel", questions: 12, answered: 9, pending: 3 },
  { id: "q2", panel: "Diplomacia Económica", panelist: "Armando Nhelete", questions: 8, answered: 3, pending: 5 },
  { id: "q3", panel: "Parcerias Público-Privadas", panelist: "João Sitoe", questions: 20, answered: 5, pending: 15 },
];

export const PANELIST_STATS = {
  sessions: 2,
  questionsReceived: 12,
  questionsPending: 3,
  rating: 4.8,
  attendees: 218,
};

export const PANELIST_QUESTIONS = [
  { id: "pq1", name: "Carlos M.", question: "Como é que a diplomacia económica beneficia PMEs locais?" },
];

export const PANELIST_RATINGS = { clarity: 4.9, relevance: 4.7 };

export const CONVERSATIONS = [
  { id: "cv1", name: "Carlos Mucavele", lastMessage: "Obrigado pela resposta!", time: "11:02", unread: 2 },
  { id: "cv2", name: "Sofia Rungo", lastMessage: "E sobre o corredor de Nacala?", time: "10:48", unread: 1 },
  { id: "cv3", name: "Ana Timane", lastMessage: "Perfeito, vejo-te na sessão.", time: "10:15", unread: 0 },
  { id: "cv4", name: "João Pelembe", lastMessage: "Pode partilhar os dados?", time: "09:52", unread: 0 },
];

export const REPORT_STATS = { attendees: 749, attendanceRate: 88, questions: 44, rating: 4.6 };
export const REPORT_ATTENDANCE = [
  { day: "day1", present: 431, total: 500, pct: 86 },
  { day: "day2", present: 318, total: 500, pct: 63 },
];

export const CHECKIN_STATS = { total: 431, lastHour: 87, corporates: 52, noShow: 69 };

export const LAST_CHECKIN = { name: "Ana Timane", time: "09:04", day: "day1" as const };

/** Speakers a participant can chat with and rate from their console view —
 * mirrors the roster in components/events/tabs/Speakers.tsx. */
export const SESSION_PANELISTS = [
  { id: "s1", name: "Teresa Machel", role: "Embaixadora · SADC" },
  { id: "s2", name: "Armando Nhelete", role: "Ministério da Economia" },
  { id: "s3", name: "João Sitoe", role: "CEO · InvestCo" },
  { id: "s4", name: "Ana Mondlane", role: "INATUR" },
  { id: "s5", name: "Paulo Chissano", role: "Banco de Moçambique" },
];

export const MY_TICKET = { code: "MC-2026-0847", type: "Delegado" };
export const MY_CREDENTIAL = { code: "CRED-0431" };
