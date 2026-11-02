// Root shell for the whole /admin panel — sits outside app/[locale]/**, so
// it has no next-intl context (the panel is Portuguese-only, per spec) and
// renders its own <html>/<body> (same pattern as app/global-not-found.tsx:
// there's no shared app/layout.tsx since the public site's root lives
// under the [locale] segment). Reuses the same globals.css design tokens
// (brand colours, fonts) as the public site — no separate visual system.
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Painel do Administrador", template: "%s · Painel MediaCraft" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full">
      <body className="h-full bg-paper-2 text-ink">{children}</body>
    </html>
  );
}
