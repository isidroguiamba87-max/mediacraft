import { getEvent, getPublicEvents } from "@/lib/pulse/endpoints";
import { buildPanels, buildSpeakerDirectory } from "@/lib/pulse/panels";
import { getNetworkingBySpeaker, getNetworkingMetrics } from "@/lib/supabase/networkingIntents";
import { NETWORKING_REASONS, type NetworkingReason, type NetworkingSpeakerStat } from "@/lib/networking/types";
import { EventPicker } from "@/components/admin/EventPicker";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { NetworkingFilters } from "@/components/admin/networking/NetworkingFilters";
import { NetworkingExportButton } from "@/components/admin/networking/NetworkingExportButton";

const REASON_LABELS: Record<NetworkingReason, string> = {
  negocio: "Negócio",
  parceria: "Parceria",
  tema: "Tema discutido",
  carreira: "Carreira",
  investimento: "Investimento",
  outro: "Outro",
};

export default async function AdminNetworkingPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; sessionId?: string; from?: string; to?: string }>;
}) {
  const { eventId, sessionId, from, to } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Networking</h1>
      <p className="mt-1 text-sm text-slate">
        Oportunidades de networking iniciadas entre participantes e oradores — de onde vieram, que motivos
        levaram ao contacto, e quais oradores geraram mais interesse.
      </p>

      <div className="mt-6">
        <EventPicker
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          selectedEventId={eventId}
          basePath="/admin/networking"
        />
      </div>

      {eventId ? (
        <EventNetworking eventId={eventId} sessionId={sessionId} from={from} to={to} />
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="text-sm text-slate">Escolhe um evento para ver as métricas de networking.</p>
        </div>
      )}
    </div>
  );
}

async function EventNetworking({
  eventId,
  sessionId,
  from,
  to,
}: {
  eventId: string;
  sessionId?: string;
  from?: string;
  to?: string;
}) {
  const filters = { sessionId, from, to };
  const [metrics, rawBySpeaker, { event }] = await Promise.all([
    getNetworkingMetrics(eventId, filters),
    getNetworkingBySpeaker(eventId, filters),
    getEvent(eventId),
  ]);

  const sessions = event ? buildPanels(event.sections).map((p) => ({ key: p.key, title: p.title })) : [];

  // Our own `networking_intents` rows only ever store the stable
  // speaker/session *ids* (see lib/supabase/networkingIntents.ts) —
  // display names and titles are resolved here against live Pulse data,
  // same reasoning as everywhere else a Pulse id has no guaranteed
  // permanence: a speaker renamed or removed since the intent was logged
  // still shows *something* (falls back to the id itself) rather than
  // crashing the page.
  const directory = event ? buildSpeakerDirectory(event.speakers, event.sections) : [];
  const speakerNameOf = new Map(directory.map((d) => [d.slug, d.name]));
  const sessionTitleOf = new Map(sessions.map((s) => [s.key, s.title]));

  const bySpeaker: NetworkingSpeakerStat[] = rawBySpeaker.map((r) => ({
    speakerId: r.speakerId,
    speakerName: speakerNameOf.get(r.speakerId) ?? r.speakerId,
    intentsCount: r.intentsCount,
    topReason: r.topReason,
    sessionTitles: r.sessionIds.map((id) => sessionTitleOf.get(id) ?? id),
  }));

  // Our own table doesn't know the event's total attendee count — fall
  // back to Pulse's own ticketsSold as "event participants", same source
  // the Dashboard report's own engagement rate already uses, rather than
  // always showing "—".
  const ticketsSold = event?.tickets.reduce((sum, t) => sum + t.quantitySold, 0) ?? 0;
  const participationRate =
    metrics.participationRate ?? (ticketsSold > 0 ? Math.round((metrics.uniqueAttendees / ticketsSold) * 100) : null);

  const sourceTotal = metrics.sourceSplit.session + metrics.sourceSplit.speakersDirectory;
  const sessionPct = sourceTotal > 0 ? Math.round((metrics.sourceSplit.session / sourceTotal) * 100) : 0;
  const directoryPct = sourceTotal > 0 ? 100 - sessionPct : 0;

  const sortedBySpeaker = [...bySpeaker].sort((a, b) => b.intentsCount - a.intentsCount);
  const maxReasonCount = Math.max(1, ...NETWORKING_REASONS.map((r) => metrics.reasonBreakdown[r] ?? 0));

  return (
    <div className="mt-8">
      <NetworkingFilters sessions={sessions} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Oportunidades iniciadas"
          value={metrics.intentsTotal}
          caption={
            participationRate !== null ? `${participationRate}% taxa de participação` : undefined
          }
        />
        <StatCard label="Participantes únicos" value={metrics.uniqueAttendees} />
        <StatCard label="Oradores com interesse" value={metrics.speakersWithInterest} />
        <StatCard
          label="Origem"
          value={`${sessionPct}% / ${directoryPct}%`}
          caption="Sessões / Directório"
        />
      </div>

      <div className="mt-6 rounded-brand border border-line bg-paper p-5">
        <p className="mb-4 text-xs font-semibold tracking-wide text-slate uppercase">Motivos do contacto</p>
        <div className="flex flex-col gap-2.5">
          {NETWORKING_REASONS.map((r) => {
            const count = metrics.reasonBreakdown[r] ?? 0;
            return (
              <div key={r} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-slate">{REASON_LABELS[r]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
                  <div
                    className="h-full rounded-full bg-brand-red"
                    style={{ width: `${(count / maxReasonCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-medium text-ink">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-slate uppercase">
          Oradores por interesse recebido
        </p>
        <NetworkingExportButton rows={sortedBySpeaker} />
      </div>

      {sortedBySpeaker.length === 0 ? (
        <p className="mt-4 text-sm text-slate">Ainda não há intenções de networking registadas.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-brand border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-slate uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Orador</th>
                <th className="px-4 py-3 font-medium">Intenções</th>
                <th className="px-4 py-3 font-medium">Motivo principal</th>
                <th className="px-4 py-3 font-medium">Sessões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sortedBySpeaker.map((s) => (
                <tr key={s.speakerId}>
                  <td className="px-4 py-3 text-ink">{s.speakerName}</td>
                  <td className="px-4 py-3 text-ink">{s.intentsCount}</td>
                  <td className="px-4 py-3 text-slate">{s.topReason ? REASON_LABELS[s.topReason] : "—"}</td>
                  <td className="px-4 py-3 text-slate">{s.sessionTitles.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
