import { MfaEnrollment } from "@/components/admin/MfaEnrollment";
import { SignOutEverywhere } from "@/components/admin/SignOutEverywhere";

export default function AdminSecurityPage() {
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
    </div>
  );
}
