"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

/**
 * Admin-panel error boundary — same reasoning as app/[locale]/error.tsx
 * (never leak error.message/stack to the screen, only Next's `digest` as a
 * log correlation id), just without next-intl since /admin is
 * Portuguese-only by design (see app/admin/layout.tsx).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
      <p className="font-display text-6xl text-brand-red">!</p>
      <h1 className="mt-4 font-display text-2xl text-brand-navy">Algo correu mal</h1>
      <p className="mt-2 text-slate">
        Ocorreu um erro inesperado no painel. Já foi registado — tenta novamente em instantes.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate/70">
          Referência do erro: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={buttonVariants("primary", "md")}>
          Tentar novamente
        </button>
        <Link href="/admin" className={buttonVariants("ghost", "md")}>
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
