import { Activity } from "lucide-react";

const PULSE_ADMIN_URL = "https://admin.devpulsemz.cloud/login";

/** Floating shortcut into the real Pulse back office (2026-10-09, "deve ter
 * um botão flutuante que fica em toda a plataforma") — this app's own admin
 * only ever reads from Pulse (events, programme, tickets); anything that
 * needs editing — the event itself, speakers, ticket tiers — happens over
 * there, so admins need a constant way out to it from every screen here. */
export function PulseAdminLink() {
  return (
    <a
      href={PULSE_ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-brand-navy px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-navy-2 print:hidden"
    >
      <Activity size={16} className="text-brand-red" />
      Configuração do evento
    </a>
  );
}
