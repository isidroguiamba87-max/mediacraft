import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.privacyPolicy" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/politica-privacidade",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacyPolicy" });
  const sections = t.raw("sections") as { title: string; body: string }[];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale as Locale, [{ name: t("title"), path: "/politica-privacidade" }])}
      />
      <LegalPage title={t("title")} updated={t("updated")} intro={t("intro")} sections={sections} />
    </>
  );
}
