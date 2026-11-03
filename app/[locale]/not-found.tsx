import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Rendered for notFound() calls inside a locale (e.g. an unknown eventId).
// Has access to the [locale] layout's messages, unlike the root
// app/not-found.tsx, which is why the copy is translated here.
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-container flex-col items-center px-6 py-32 text-center lg:px-10">
      <p className="font-display text-6xl text-brand-red">404</p>
      <h1 className="mt-4 font-display text-2xl text-brand-navy">{t("title")}</h1>
      <p className="mt-2 text-slate">{t("subtitle")}</p>
      <Link href="/" className={buttonVariants("primary", "md", "mt-8")}>
        {t("backHome")}
      </Link>
    </div>
  );
}
