// Root shell for /responder/** — sits outside app/[locale]/** (see
// proxy.ts) and outside app/admin/**, so like admin it needs its own
// <html>/<body> and its own import of globals.css; there's no shared
// app/layout.tsx covering every route in this project.
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Responder a perguntas — MediaCraft",
  robots: { index: false, follow: false },
};

export default function ResponderRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full">
      <body className="h-full bg-paper-2 text-ink">{children}</body>
    </html>
  );
}
