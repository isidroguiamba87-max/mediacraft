import { listQuestions, type AdminQuestion } from "@/lib/supabase/questions";
import { listEventOverrides } from "@/lib/supabase/eventOverrides";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { QuestionRow } from "@/components/admin/questions/QuestionRow";
import { QaToggle } from "@/components/admin/questions/QaToggle";
import { SpeakerLinkButton } from "@/components/admin/questions/SpeakerLinkButton";

const GENERAL_BUCKET = "__general__";

/** Groups a flat question list first by event, then by panel/session
 * within each event (2026-10-09, "a organização das perguntas no painel
 * do admin deve estar organizada por painel ou sessão") — `panelTitle` is
 * a free-text snapshot taken when the question was submitted (see
 * EventQuestion's comment in lib/bff), so this is just a string match,
 * not a join. Questions with no panel chosen land in a shared "Geral"
 * bucket per event. Insertion order preserved (both `questions` arrives
 * newest-first already) rather than re-sorting. */
function groupByEventThenPanel(questions: AdminQuestion[]) {
  const eventOrder: string[] = [];
  const byEvent = new Map<string, AdminQuestion[]>();
  for (const q of questions) {
    if (!byEvent.has(q.eventId)) {
      eventOrder.push(q.eventId);
      byEvent.set(q.eventId, []);
    }
    byEvent.get(q.eventId)!.push(q);
  }

  return eventOrder.map((eventId) => {
    const eventQuestions = byEvent.get(eventId)!;
    const panelOrder: string[] = [];
    const byPanel = new Map<string, AdminQuestion[]>();
    for (const q of eventQuestions) {
      const key = q.panelTitle ?? GENERAL_BUCKET;
      if (!byPanel.has(key)) {
        panelOrder.push(key);
        byPanel.set(key, []);
      }
      byPanel.get(key)!.push(q);
    }

    // Distinct speakers actually asked something in this event — this is
    // what drives which "copiar link" buttons show up, not Pulse's full
    // speaker roster, since a link only makes sense once there's at least
    // one question for that person to answer.
    const speakers = [...new Set(eventQuestions.map((q) => q.speakerName).filter((s): s is string => !!s))];

    return {
      eventId,
      speakers,
      panels: panelOrder.map((key) => ({
        title: key === GENERAL_BUCKET ? "Geral" : key,
        questions: byPanel.get(key)!,
      })),
    };
  });
}

export default async function AdminQuestionsPage() {
  const [questions, { events }] = await Promise.all([listQuestions(), getPublicEvents({ status: "all" })]);
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));
  const overrides = await listEventOverrides(events.map((e) => e.id));

  const counts = {
    new: questions.filter((q) => q.status === "new").length,
    reviewed: questions.filter((q) => q.status === "reviewed").length,
    archived: questions.filter((q) => q.status === "archived").length,
  };

  const grouped = groupByEventThenPanel(questions);

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Perguntas do público</h1>
      <p className="mt-1 text-sm text-slate">
        Tudo o que é perguntado no site chega aqui. Só as marcadas como &ldquo;relevante&rdquo; aparecem
        publicamente na aba &ldquo;Perguntas&rdquo; de cada evento.
      </p>
      <p className="mt-2 text-xs text-slate">
        {counts.new} novas · {counts.reviewed} revistas · {counts.archived} arquivadas
      </p>

      <div className="mt-6 rounded-brand border border-line bg-paper p-4">
        <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-slate uppercase">
          Secção &ldquo;Perguntas&rdquo; por evento
        </p>
        <p className="mt-1 text-xs text-slate">
          Desligada por omissão — liga para o evento mostrar a aba &ldquo;Perguntas&rdquo; (e o formulário de
          envio) no site público.
        </p>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-slate">Sem eventos.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-ink">{e.title}</span>
                <QaToggle eventId={e.id} enabled={overrides.get(e.id)?.qaEnabled ?? false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="text-sm text-slate">Ainda não há perguntas.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-10">
          {grouped.map(({ eventId, speakers, panels }) => (
            <div key={eventId}>
              <h2 className="font-display text-lg text-brand-navy">{eventTitle.get(eventId) ?? eventId}</h2>

              {speakers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {speakers.map((speaker) => (
                    <SpeakerLinkButton key={speaker} eventId={eventId} speakerName={speaker} />
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-6">
                {panels.map(({ title, questions: panelQuestions }) => (
                  <div key={title}>
                    <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-brand-red uppercase">
                      {title}
                    </p>
                    <ul className="mt-3 flex flex-col gap-3">
                      {panelQuestions.map((q) => (
                        <QuestionRow key={q.id} question={q} eventTitle={eventTitle.get(q.eventId) ?? q.eventId} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
