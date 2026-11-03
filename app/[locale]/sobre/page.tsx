import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Intro } from "@/components/about/Intro";
import { MissionVision } from "@/components/about/MissionVision";
import { History } from "@/components/about/History";
import { Team } from "@/components/about/Team";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/sobre",
    title: t("title"),
    description: t("description"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Intro />
      <MissionVision />
      <History />
      <Team />
    </>
  );
}
