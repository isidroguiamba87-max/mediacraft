import { Users, Clock, Ticket } from "lucide-react";
import { getEvent, getPublicEvents } from "@/lib/pulse/endpoints";
import { formatDate, formatPrice } from "@/lib/utils";
import { EventPicker } from "@/components/admin/EventPicker";

export default async function AdminPulseDataPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Dados do Pulse</h1>
      <p className="mt-1 text-sm text-slate">
        Consulta, só de leitura, ao que o Pulse já tem sobre o evento — programa, oradores e bilhetes. Nada
        aqui é editável nem escreve de volta no Pulse.
      </p>

      <div className="mt-6">
        <EventPicker
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          selectedEventId={eventId}
          basePath="/admin/pulse"
        />
      </div>

      {eventId && <PulseData eventId={eventId} />}
    </div>
  );
}

async function PulseData({ eventId }: { eventId: string }) {
  const { event } = await getEvent(eventId);

  if (!event) {
    return <p className="mt-6 text-sm text-slate">Não foi possível encontrar este evento no Pulse.</p>;
  }

  const ticketsSold = event.tickets.reduce((sum, t) => sum + t.quantitySold, 0);
  const ticketsTotal = event.tickets.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Resumo */}
      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-xl text-brand-navy">{event.title}</h2>
        {event.scheduleDates.length > 0 && (
          <p className="mt-1 text-sm text-slate">
            {event.scheduleDates
              .map((d) => `${formatDate(d.date, "pt")} · ${d.timeFrom}–${d.timeTo}`)
              .join(" · ")}
          </p>
        )}
        {event.location?.name && <p className="mt-1 text-sm text-slate">{event.location.name}</p>}

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label="Bilhetes vendidos" value={ticketsSold} />
          <Fact label="Capacidade" value={ticketsTotal} />
          <Fact label="Sessões" value={event.sections.reduce((sum, s) => sum + s.sessions.length, 0)} />
          <Fact label="Oradores" value={event.speakers.length} />
        </div>
      </div>

      {/* Bilhetes */}
      <div>
        <SectionTitle icon={<Ticket size={14} className="text-brand-red" />}>Bilhetes</SectionTitle>
        {event.tickets.length === 0 ? (
          <p className="text-sm text-slate">Sem bilhetes configurados.</p>
        ) : (
          <div className="overflow-x-auto rounded-brand border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-slate uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Bilhete</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3 font-medium">Vendidos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {event.tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-ink">{t.title}</td>
                    <td className="px-4 py-3 text-slate">{t.area}</td>
                    <td className="px-4 py-3 text-slate">{t.price === 0 ? "Grátis" : formatPrice(t.price, "pt-MZ")}</td>
                    <td className="px-4 py-3 text-slate">
                      {t.quantitySold} / {t.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate">{t.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Programa */}
      <div>
        <SectionTitle icon={<Clock size={14} className="text-brand-red" />}>Programa</SectionTitle>
        {event.sections.every((s) => s.sessions.length === 0) ? (
          <p className="text-sm text-slate">Sem sessões publicadas no Pulse para este evento.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {event.sections.map((section, i) => (
              <div key={i} className="rounded-brand border border-line bg-paper p-4">
                <p className="text-xs font-semibold tracking-wide text-slate uppercase">{section.title}</p>
                {section.sessions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate">Sem sessões nesta secção.</p>
                ) : (
                  <ul className="mt-2 flex flex-col divide-y divide-line">
                    {section.sessions.map((s, j) => (
                      <li key={s.id ?? j} className="py-2 text-sm">
                        <span className="font-mono text-xs text-brand-red">
                          {s.timeFrom}–{s.timeTo}
                        </span>{" "}
                        <span className="text-ink">{s.title}</span>
                        {s.speakers.length > 0 && (
                          <span className="text-slate"> · {s.speakers.map((sp) => sp.name).join(", ")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Oradores */}
      <div>
        <SectionTitle icon={<Users size={14} className="text-brand-red" />}>Oradores</SectionTitle>
        {event.speakers.length === 0 ? (
          <p className="text-sm text-slate">Sem oradores listados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {event.speakers.map((sp, i) => (
              <div key={i} className="rounded-brand border border-line bg-paper p-3 text-center">
                {sp.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media
                  <img src={sp.photoUrl} alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-xs text-white">
                    {sp.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <p className="mt-2 text-xs font-medium text-ink">{sp.name}</p>
                {(sp.occupation || sp.company) && (
                  <p className="text-[11px] text-slate">{[sp.occupation, sp.company].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
      <p className="font-display text-xl text-brand-navy">{value}</p>
      <p className="text-xs text-slate">{label}</p>
    </div>
  );
}
