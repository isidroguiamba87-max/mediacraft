"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary — only fires when a root layout itself throws
 * (app/[locale]/layout.tsx or app/admin/layout.tsx), which the error.tsx
 * inside those segments can't catch. Must render its own <html>/<body>,
 * same reasoning as global-not-found.tsx: there's no shared app/layout.tsx
 * to fall back on. No next-intl context available here either.
 */
export default function GlobalError({
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
    <html lang="pt" className="h-full">
      <body className="flex min-h-full flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="font-display text-6xl text-brand-red">!</p>
        <h1 className="mt-4 font-display text-2xl text-brand-navy">Algo correu mal</h1>
        <p className="mt-2 text-slate">
          Ocorreu um erro inesperado. Já fomos notificados — tenta novamente em instantes.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate/70">
            Referência do erro: <code>{error.digest}</code>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-medium text-white hover:bg-brand-red-deep"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
