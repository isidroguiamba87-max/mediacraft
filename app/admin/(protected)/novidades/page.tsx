import Link from "next/link";
import { Plus } from "lucide-react";
import { listNews } from "@/lib/supabase/news";
import { getPublicEvents } from "@/lib/pulse/endpoints";
import { Button } from "@/components/ui/Button";
import { DeleteNewsButton } from "@/components/admin/news/DeleteNewsButton";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-paper-2 text-slate",
  scheduled: "bg-brand-navy/10 text-brand-navy",
  published: "bg-green-100 text-green-700",
};

export default async function AdminNewsListPage() {
  const [news, { events }] = await Promise.all([listNews(), getPublicEvents({ status: "all" })]);
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-brand-navy">Novidades</h1>
          <p className="mt-1 text-sm text-slate">
            Geridas aqui, aparecem em /novidades no site — associar a um evento é opcional.
          </p>
        </div>
        <Link href="/admin/novidades/nova">
          <Button>
            <Plus size={16} />
            Nova novidade
          </Button>
        </Link>
      </div>

      {news.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="text-sm text-slate">Ainda não há novidades criadas.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-brand border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-slate uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Destaque</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {news.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-ink">{item.title}</td>
                  <td className="px-4 py-3 text-slate">
                    {item.eventId ? (eventTitle.get(item.eventId) ?? item.eventId) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate">{item.featured ? "Sim" : "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/novidades/${item.id}`}
                      className="text-sm font-medium text-brand-navy hover:text-brand-red"
                    >
                      Editar
                    </Link>
                    <DeleteNewsButton id={item.id} title={item.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
