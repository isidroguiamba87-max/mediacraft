import { getEvent, getPublicEvents } from "@/lib/pulse/endpoints";
import { getEventOverride } from "@/lib/supabase/eventOverrides";
import { EventPicker } from "@/components/admin/EventPicker";
import { EventVisualForm } from "@/components/admin/events/EventVisualForm";

export default async function AdminEventVisualPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Visual do Evento</h1>
      <p className="mt-1 text-sm text-slate">
        Uma camada por cima do Pulse, só de apresentação — o evento em si (bilhetes, programa, oradores)
        continua 100% gerido no Pulse e nunca é alterado a partir daqui.
      </p>

      <div className="mt-6">
        <EventPicker
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          selectedEventId={eventId}
          basePath="/admin/eventos"
        />
      </div>

      {eventId && <EventVisualEditor eventId={eventId} />}
    </div>
  );
}

async function EventVisualEditor({ eventId }: { eventId: string }) {
  const [{ event }, override] = await Promise.all([getEvent(eventId), getEventOverride(eventId)]);

  if (!event) {
    return <p className="mt-6 text-sm text-slate">Não foi possível encontrar este evento no Pulse.</p>;
  }

  return (
    <div className="mt-6 max-w-2xl">
      <p className="mb-4 font-display text-lg text-brand-navy">{event.title}</p>
      <EventVisualForm eventId={eventId} pulseCoverUrl={event.coverUrl} override={override} />
    </div>
  );
}
