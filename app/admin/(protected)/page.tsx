import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { getDashboardStats } from "@/lib/supabase/dashboard";
import { getReportData } from "@/lib/supabase/report";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { formatDate } from "@/lib/utils";
import { EventPicker } from "@/components/admin/EventPicker";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { StarDistribution } from "@/components/admin/dashboard/StarDistribution";
import { PrintButton } from "@/components/admin/report/PrintButton";

/** Dashboard and the old standalone "Relatório" page merged into one
 * (2026-10-09: "juntes... mesma coisa... usasse o visual do relatório e
 * poder baixar") — "Todos os eventos" shows the overview stat cards this
 * page always had; picking one specific event switches to the detailed,
 * printable per-event report that used to live at /admin/relatorio. */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <div className="print:hidden">
        <h1 className="font-display text-2xl text-brand-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-slate">
          Indicadores gerais de todos os eventos, ou escolhe um evento para o relatório completo —
          classificação, pontos fortes/a melhorar, perguntas e imagens, pronto a exportar em PDF.
        </p>

        <div className="mt-6">
          <EventPicker
            events={events.map((e) => ({ id: e.id, title: e.title }))}
            selectedEventId={eventId}
            basePath="/admin"
            allLabel="Todos os eventos"
          />
        </div>
      </div>

      {eventId ? <Report eventId={eventId} /> : <Overview />}
    </div>
  );
}

async function Overview() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avaliações" value={stats.ratingsCount} />
        <StatCard
          label="Média de estrelas"
          value={stats.ratingsCount > 0 ? stats.averageStars.toFixed(1) : "—"}
        />
        <StatCard
          label="Perguntas"
          value={stats.questions.new + stats.questions.reviewed + stats.questions.archived}
          caption={`${stats.questions.new} novas · ${stats.questions.relevant} visíveis no site`}
        />
        <StatCard
          label="Conteúdo publicado"
          value={stats.news.published + stats.galleryCount}
          caption={`${stats.news.published} novidades · ${stats.galleryCount} na galeria`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-brand border border-line bg-paper p-5">
          <p className="mb-4 text-xs font-semibold tracking-wide text-slate uppercase">
            Distribuição das avaliações
          </p>
          {stats.ratingsCount === 0 ? (
            <p className="text-sm text-slate">Ainda não há avaliações.</p>
          ) : (
            <StarDistribution distribution={stats.starDistribution} total={stats.ratingsCount} />
          )}
        </div>

        <div className="rounded-brand border border-line bg-paper p-5">
          <p className="mb-4 text-xs font-semibold tracking-wide text-slate uppercase">Novidades por estado</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate">Publicadas</span>
              <span className="font-medium text-ink">{stats.news.published}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Agendadas</span>
              <span className="font-medium text-ink">{stats.news.scheduled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Rascunhos</span>
              <span className="font-medium text-ink">{stats.news.draft}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function Report({ eventId }: { eventId: string }) {
  const data = await getReportData(eventId);
  const totalRatings = data.ratings.length;
  const engagementPct =
    data.event && data.event.ticketsSold > 0
      ? Math.round((totalRatings / data.event.ticketsSold) * 100)
      : null;

  return (
    <div className="mt-6 flex flex-col gap-8 rounded-brand border border-line bg-paper p-6 print:mt-0 print:border-0 print:p-0 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand-red uppercase">Relatório do evento</p>
          <h2 className="mt-1 font-display text-2xl text-brand-navy">{data.event?.title ?? eventId}</h2>
          {data.event && data.event.scheduleDates.length > 0 && (
            <p className="mt-1 text-sm text-slate">
              {formatDate(data.event.scheduleDates[0].date, "pt")}
              {data.event.locationName && ` · ${data.event.locationName}`}
            </p>
          )}
        </div>
        <PrintButton />
      </div>

      {/* Resumo factual — dados do Pulse */}
      <section>
        <SectionTitle>Resumo</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label="Bilhetes vendidos" value={data.event?.ticketsSold ?? "—"} />
          <Fact label="Capacidade" value={data.event?.ticketsTotal ?? "—"} />
          <Fact label="Sessões" value={data.event?.sessionsCount ?? "—"} />
          <Fact label="Oradores" value={data.event?.speakersCount ?? "—"} />
        </div>
      </section>

      {/* Classificação geral */}
      <section>
        <SectionTitle>Classificação geral</SectionTitle>
        {totalRatings === 0 ? (
          <p className="text-sm text-slate">Ainda não há avaliações para este evento.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex items-center gap-2">
              <span className="font-display text-4xl text-brand-navy">{data.averageStars.toFixed(1)}</span>
              <Star size={24} className="fill-brand-red text-brand-red" />
              <span className="text-sm text-slate">({totalRatings})</span>
            </div>
            <div className="max-w-sm">
              <StarDistribution distribution={data.starDistribution} total={totalRatings} />
            </div>
          </div>
        )}
        {engagementPct !== null && (
          <p className="mt-3 text-xs text-slate">
            {totalRatings} avaliações para {data.event?.ticketsSold} bilhetes vendidos (~{engagementPct}% de
            participação na avaliação) — uma leitura simples, não uma correlação estatística, mas dá uma ideia
            de quão representativa é a amostra.
          </p>
        )}
      </section>

      {/* Pontos fortes / a melhorar */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <SectionTitle icon={<ThumbsUp size={15} className="text-brand-red" />}>Pontos fortes</SectionTitle>
          {data.strengths.length === 0 ? (
            <p className="text-sm text-slate">Sem comentários de 4-5 estrelas ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.strengths.map((r, i) => (
                <li key={i} className="rounded-brand border border-line bg-paper-2 p-3 text-sm text-ink">
                  &ldquo;{r.comment}&rdquo;
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <SectionTitle icon={<ThumbsDown size={15} className="text-brand-red" />}>A melhorar</SectionTitle>
          {data.improvements.length === 0 ? (
            <p className="text-sm text-slate">Sem comentários de 1-2 estrelas ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.improvements.map((r, i) => (
                <li key={i} className="rounded-brand border border-line bg-paper-2 p-3 text-sm text-ink">
                  &ldquo;{r.comment}&rdquo;
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Perguntas relevantes */}
      <section>
        <SectionTitle>Perguntas relevantes</SectionTitle>
        {data.relevantQuestions.length === 0 ? (
          <p className="text-sm text-slate">Sem perguntas marcadas como relevantes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.relevantQuestions.map((q, i) => (
              <li key={i} className="rounded-brand border border-line bg-paper-2 p-3 text-sm">
                <p className="text-ink">{q.question}</p>
                <p className="mt-1 text-xs text-slate">— {q.name}</p>
                {q.answer && <p className="mt-1.5 text-xs text-brand-navy">Resposta: {q.answer}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Imagens */}
      <section>
        <SectionTitle>Imagens do evento</SectionTitle>
        {data.gallery.filter((g) => g.type === "image").length === 0 ? (
          <p className="text-sm text-slate">Sem imagens publicadas.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {data.gallery
              .filter((g) => g.type === "image")
              .map((g) => (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage image
                <img
                  key={g.id}
                  src={g.storageUrl ?? ""}
                  alt={g.caption ?? ""}
                  className="aspect-square rounded-brand object-cover"
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate uppercase">
      {icon}
      {children}
    </p>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-2xl text-brand-navy">{value}</p>
      <p className="text-xs text-slate">{label}</p>
    </div>
  );
}
