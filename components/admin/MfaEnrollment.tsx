"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Factor = { id: string; status: "verified" | "unverified" };

/**
 * Self-service TOTP enrollment for the signed-in admin's own account.
 * Entirely client-side against Supabase Auth's own `mfa.*` API (no new
 * privilege boundary — an authenticated user managing their own factors)
 * — the security-sensitive half, actually *requiring* the code at login,
 * is enforced server-side in app/admin/mfa/actions.ts and
 * (protected)/layout.tsx, not here.
 */
export function MfaEnrollment() {
  const supabase = createClient();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [loading, startLoadingTransition] = useTransition();
  const [enrolling, setEnrolling] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    startLoadingTransition(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error) {
        setFactor(data.totp[0] ? { id: data.totp[0].id, status: data.totp[0].status } : null);
      }
    });
  }

  // `supabase` is a fresh client instance every render (createClient() isn't
  // memoized), so listing it as a dep would just make this re-run every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, []);

  async function startEnroll() {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) {
      toast.error("Não foi possível iniciar a ativação. Tenta novamente.");
      return;
    }
    setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setBusy(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrolling.factorId,
    });
    if (challengeError || !challenge) {
      setBusy(false);
      toast.error("Não foi possível verificar o código. Tenta novamente.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (verifyError) {
      toast.error("Código inválido.");
      return;
    }
    toast.success("Verificação em duas etapas ativada.");
    setEnrolling(null);
    setCode("");
    refresh();
  }

  async function cancelEnroll() {
    if (enrolling) await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
    setEnrolling(null);
    setCode("");
  }

  async function removeFactor() {
    if (!factor) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível desativar.");
      return;
    }
    toast.success("Verificação em duas etapas desativada.");
    refresh();
  }

  if (loading) return null;

  if (enrolling) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm text-slate">
          Lê o código QR com a tua aplicação autenticadora (Google Authenticator, Authy, etc.) e
          introduz o código gerado para confirmar.
        </p>
        <div
          className="h-48 w-48 self-center [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: enrolling.qrCode }}
        />
        <p className="text-center text-xs text-slate">
          Não consegues ler? Introduz manualmente: <code className="text-ink">{enrolling.secret}</code>
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          className="h-11 w-full self-center rounded-brand border border-line bg-paper px-4 text-center text-lg tracking-[0.3em] text-ink outline-none focus-visible:border-brand-red sm:w-48"
        />
        <div className="flex justify-center gap-3">
          <Button variant="ghost" disabled={busy} onClick={cancelEnroll}>
            Cancelar
          </Button>
          <Button disabled={busy || code.length !== 6} onClick={confirmEnroll}>
            Confirmar
          </Button>
        </div>
      </div>
    );
  }

  if (factor?.status === "verified") {
    return (
      <div className="mt-4 flex items-center justify-between rounded-brand border border-line bg-paper-2 px-4 py-3">
        <p className="text-sm text-ink">Verificação em duas etapas ativa.</p>
        <Button variant="ghost" disabled={busy} onClick={removeFactor}>
          Desativar
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-brand border border-dashed border-line px-4 py-3">
      <p className="text-sm text-slate">Verificação em duas etapas desativada.</p>
      <Button disabled={busy} onClick={startEnroll}>
        Ativar
      </Button>
    </div>
  );
}
