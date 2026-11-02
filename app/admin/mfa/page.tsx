import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaChallengeForm } from "./MfaChallengeForm";

/**
 * Second factor step — only reachable with a valid password-verified
 * (aal1) session that has a verified TOTP factor pending (see
 * loginAction's redirect and (protected)/layout.tsx's own check). Anyone
 * else lands here with nothing to verify, so they're sent back to
 * wherever is actually appropriate for their session.
 */
export default async function AdminMfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === aal.nextLevel) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-brand border border-line bg-paper p-8 shadow-brand">
        <h1 className="font-display text-xl text-brand-navy">Verificação em duas etapas</h1>
        <p className="mt-1 text-sm text-slate">
          Introduz o código de 6 dígitos da tua aplicação autenticadora.
        </p>
        <MfaChallengeForm />
      </div>
    </div>
  );
}
