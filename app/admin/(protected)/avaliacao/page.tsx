import { getRatingForm, listRatingsForEvent, getRatingsBySession } from "@/lib/supabase/ratings";
import { getPublicEvents, getEvent } from "@/lib/pulse/endpoints";
import { buildPanels } from "@/lib/pulse/panels";
import { EventPicker } from "@/components/admin/EventPicker";
import { FormSettings } from "@/components/admin/ratings/FormSettings";
import { QuestionsBuilder } from "@/components/admin/ratings/QuestionsBuilder";
import { RatingSessionFilter } from "@/components/admin/ratings/RatingSessionFilter";

export default async function AdminRatingPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; sessionId?: string }>;
}) {
  const { eventId, sessionId } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Avaliação do evento</h1>
      <p className="mt-1 text-sm text-slate">
        Configura o formulário (estrelas + comentário são sempre pedidos, mais perguntas extra à escolha) e a
        janela em que o pop-up de avaliação do evento todo aparece no site. O mesmo formulário também pode ser
        respondido painel a painel — o botão &quot;Avaliar este painel&quot; aparece automaticamente na página de
        cada painel assim que o horário desse painel termina, sem precisares de configurar nada aqui.
      </p>

      <div className="mt-6">
        <EventPicker
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          selectedEventId={eventId}
          basePath="/admin/avaliacao"
        />
      </div>

      {eventId && <RatingConfig eventId={eventId} sessionId={sessionId} />}
    </div>
  );
}

async function RatingConfig({ eventId, sessionId }: { eventId: string; sessionId?: string }) {
  const [form, ratings, bySession, { event }] = await Promise.all([
    getRatingForm(eventId),
    listRatingsForEvent(eventId),
    getRatingsBySession(eventId),
    getEvent(eventId),
  ]);

  const panels = event ? buildPanels(event.sections).map((p) => ({ key: p.key, title: p.title })) : [];
  const panelTitleOf = new Map(panels.map((p) => [p.key, p.title]));

  const filteredRatings =
    sessionId === "__event__"
      ? ratings.filter((r) => !r.sessionId)
      : sessionId
        ? ratings.filter((r) => r.sessionId === sessionId)
        : ratings;

  const sortedBySession = [...bySession].sort((a, b) => b.count - a.count);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <FormSettings eventId={eventId} form={form} />

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate uppercase">
          Perguntas extra (além de estrelas + comentário)
        </p>
        <QuestionsBuilder formId={form?.id ?? null} questions={form?.questions ?? []} />
      </div>

      {sortedBySession.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide text-slate uppercase">
            Avaliações por painel
          </p>
          <div className="overflow-x-auto rounded-brand border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-slate uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Painel</th>
                  <th className="px-4 py-3 font-medium">Avaliações</th>
                  <th className="px-4 py-3 font-medium">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedBySession.map((s) => (
                  <tr key={s.sessionId}>
                    <td className="px-4 py-3 text-ink">{panelTitleOf.get(s.sessionId) ?? s.sessionId}</td>
                    <td className="px-4 py-3 text-ink">{s.count}</td>
                    <td className="px-4 py-3 text-brand-red">{s.averageStars.toFixed(1)}★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-slate uppercase">
            Avaliações recebidas ({filteredRatings.length})
          </p>
          <RatingSessionFilter eventId={eventId} sessions={panels} />
        </div>
        {filteredRatings.length === 0 ? (
          <p className="text-sm text-slate">Ainda não há avaliações para este filtro.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-brand border border-line bg-paper">
            {filteredRatings.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4">
                <span className="font-display text-lg text-brand-red">{r.stars}★</span>
                <p className="min-w-0 flex-1 truncate text-sm text-ink">{r.comment || "—"}</p>
                <span className="shrink-0 text-xs text-slate">
                  {r.sessionId ? (panelTitleOf.get(r.sessionId) ?? r.sessionId) : "Evento"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
