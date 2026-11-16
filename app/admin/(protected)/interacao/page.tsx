import { headers } from "next/headers";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { getPanelToken, listPanelMessagesAdmin, type PanelMessage } from "@/lib/supabase/panelRoom";
import { routing } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";
import { EventPicker } from "@/components/admin/EventPicker";
import { PanelLinkCard } from "@/components/admin/panelRoom/PanelLinkCard";
import { DeleteMessageButton } from "@/components/admin/panelRoom/DeleteMessageButton";

/**
 * "Interação" (2026-11-13) — replaces the old "Perguntas" module. One
 * private link per event for the panelists' space, plus every message
 * posted there (with delete).
 */
export default async function AdminPanelRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const { events } = await getPublicEvents({ status: "all" });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">Interação dos painelistas</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        As perguntas públicas foram removidas do site. Em vez disso, cada evento tem um link privado: envie-o aos
        painelistas e eles abrem a página do evento com um espaço para escrever perguntas e interagir entre si. Só
        quem tem o link entra.
      </p>

      <div className="mt-6">
        <EventPicker
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          selectedEventId={eventId}
          basePath="/admin/interacao"
        />
      </div>

      {eventId && <EventRoom eventId={eventId} />}
    </div>
  );
}

async function EventRoom({ eventId }: { eventId: string }) {
  const [token, messages] = await Promise.all([
    getPanelToken(eventId).catch(() => null),
    listPanelMessagesAdmin(eventId).catch((): PanelMessage[] | null => null),
  ]);

  // Full public URL: the request's own host in development, the site URL otherwise.
  const h = await headers();
  const host = h.get("host");
  const origin = host && /localhost|127\.0\.0\.1/.test(host) ? `http://${host}` : siteConfig.url;
  const url = token ? `${origin}/${routing.defaultLocale}/eventos/${eventId}/interacao/${token}` : null;

  return (
    <div className="mt-6 flex max-w-3xl flex-col gap-6">
      <PanelLinkCard eventId={eventId} url={url} />

      <div className="rounded-brand border border-line bg-paper p-5">
        <h2 className="font-display text-lg text-brand-navy">
          Mensagens {messages ? <span className="text-sm text-slate">· {messages.length}</span> : null}
        </h2>
        {messages === null ? (
          <p className="mt-3 text-sm text-slate">
            Não foi possível ler as mensagens. Confirme que o SQL da interação
            (supabase/migrations/2026-11-13_panel_interaction.sql) já foi corrido no Supabase.
          </p>
        ) : messages.length === 0 ? (
          <p className="mt-3 text-sm text-slate">Ainda não há mensagens.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className="flex items-start gap-3 rounded-brand border border-line bg-paper-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-medium text-ink">{m.name}</span>
                    <span className="text-xs text-slate">
                      {new Date(m.createdAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line text-ink">{m.message}</p>
                </div>
                <DeleteMessageButton id={m.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
