import { MfaEnrollment } from "@/components/admin/MfaEnrollment";
import { SignOutEverywhere } from "@/components/admin/SignOutEverywhere";
import { listRecentAuditLog } from "@/lib/supabase/auditLog";
import { formatDate } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  "news.create": "Criou uma novidade",
  "news.update": "Editou uma novidade",
  "news.delete": "Apagou uma novidade",
  "gallery.delete": "Apagou um item da galeria",
  "event_override.save": "Alterou a capa/cor de um evento",
  "event_override.clear": "Repôs a capa/cor de um evento",
  "event_override.set_qa_enabled": "Ligou/desligou Perguntas de um evento",
};

export default async function AdminSecurityPage() {
  const log = await listRecentAuditLog().catch(() => []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-brand-navy">Segurança</h1>
        <p className="mt-1 text-sm text-slate">Gere o acesso à tua conta de administrador.</p>
      </div>

      <section>
        <h2 className="font-display text-lg text-brand-navy">Verificação em duas etapas</h2>
        <p className="mt-1 text-sm text-slate">
          Depois de ativada, cada entrada pede também um código de 6 dígitos de uma aplicação
          autenticadora, além da palavra-passe.
        </p>
        <MfaEnrollment />
      </section>

      <section>
        <h2 className="font-display text-lg text-brand-navy">Sessões</h2>
        <p className="mt-1 text-sm text-slate">
          Se suspeitares que a tua conta foi acedida por outra pessoa, usa isto para desligar
          todas as sessões ativas — vais precisar de voltar a entrar em todos os dispositivos.
        </p>
        <div className="mt-4">
          <SignOutEverywhere />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-brand-navy">Atividade recente</h2>
        <p className="mt-1 text-sm text-slate">
          As últimas ações administrativas que mudam o que o site público mostra.
        </p>
        {log.length === 0 ? (
          <p className="mt-4 text-sm text-slate">Ainda sem registos.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 rounded-brand border border-line bg-paper-2 px-4 py-3 text-sm"
              >
                <span className="font-medium text-ink">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="text-xs text-slate">
                  {entry.actorEmail} · {entry.resource} ·{" "}
                  {formatDate(entry.createdAt, "pt", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
