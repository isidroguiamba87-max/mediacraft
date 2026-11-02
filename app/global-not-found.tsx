// Catches truly unmatched URLs across the whole app (i.e. paths that
// don't even resolve to a locale). Requires `experimental.globalNotFound`
// in next.config.ts because the root layout lives under the [locale]
// dynamic segment, so there's no single static root to compose a
// not-found page from otherwise. It bypasses app/[locale]/layout.tsx
// entirely, so it renders its own <html>/<body> and has no next-intl
// context — this is the one page on the site that isn't translated.
// For 404s inside a locale (e.g. an unknown event id), see
// app/[locale]/not-found.tsx instead.
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Página não encontrada · MediaCraft",
  description: "A página que procura não existe ou foi movida.",
};

export default function GlobalNotFound() {
  return (
    <html lang="pt" className="h-full">
      <body className="flex min-h-full flex-col items-center justify-center bg-paper px-6 text-center">
        <p className="font-display text-6xl text-brand-red">404</p>
        <h1 className="mt-4 font-display text-2xl text-brand-navy">
          Página não encontrada
        </h1>
        <p className="mt-2 text-slate">
          A página que procura não existe ou foi movida.
        </p>
        <Link
          href="/pt"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-medium text-white hover:bg-brand-red-deep"
        >
          Voltar ao início
        </Link>
      </body>
    </html>
  );
}
