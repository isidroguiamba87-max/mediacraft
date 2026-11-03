import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Intro } from "@/components/about/Intro";
import { MissionVision } from "@/components/about/MissionVision";
import { History } from "@/components/about/History";
import { Team } from "@/components/about/Team";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, personSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { team } from "@/content/team";

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

  const [tNav, tMembers] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "team.members" }),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale as Locale, [{ name: tNav("about"), path: "/sobre" }])} />
      {team.map((member) => (
        <JsonLd key={member.id} data={personSchema(member, tMembers(`${member.id}.role`))} />
      ))}
      <Intro />
      <MissionVision />
      <History />
      <Team />
    </>
  );
}
