import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/config/i18n";
import { siteConfig } from "@/config/site.config";
import { defaultRobots } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PulseLauncher } from "@/components/pulse/PulseLauncher";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#001B32",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    keywords: t("keywords"),
    // Deliberately no `alternates`/`openGraph` here — every page under this
    // layout sets its own via lib/seo.ts's buildMetadata, with its real
    // path, not just the locale root. A value set here would apply to
    // every page that doesn't override it, which used to be the bug:
    // every page advertised the homepage as its hreflang alternate.
    robots: defaultRobots(),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enables static rendering for this locale (see next-intl docs).
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <PulseLauncher>
            <Header />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
            {/* After the footer, not before: MobileBottomNav's own spacer
             * div reserves room for its fixed bar right where it sits in
             * the flow — before the footer, that space landed between
             * </main> and the footer instead of after it, so the footer's
             * last line rendered straight under the fixed bar and got
             * clipped (2026-11-03). The bar itself is `fixed`, so its own
             * on-screen position doesn't depend on this DOM order. */}
            <MobileBottomNav />
          </PulseLauncher>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
