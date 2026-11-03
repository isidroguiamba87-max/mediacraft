import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/config/i18n";
import { buildMetadata } from "@/lib/seo";
import { servicesSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { services } from "@/content/services";
import { ScrollThread } from "@/components/showcase/ScrollThread";
import { ThreadStation } from "@/components/showcase/ThreadStation";
import { ShowcaseHero } from "@/components/showcase/ShowcaseHero";
import { FlagshipEvent } from "@/components/showcase/FlagshipEvent";
import { NumbersStation } from "@/components/showcase/NumbersStation";
import { EventsShowcase } from "@/components/home/EventsShowcase";
import { ServicesOrbit } from "@/components/showcase/ServicesOrbit";
import { Partners } from "@/components/home/Partners";
import { CTA } from "@/components/home/CTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildMetadata({
    locale: locale as Locale,
    path: "",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tServices = await getTranslations({ locale, namespace: "services.items" });
  const serviceList = services.map((s) => ({
    title: tServices(`${s.id}.title`),
    description: tServices(`${s.id}.description`),
  }));

  return (
    <ScrollThread>
      <JsonLd data={servicesSchema(serviceList)} />
      <ThreadStation>
        <ShowcaseHero />
      </ThreadStation>
      <ThreadStation>
        <FlagshipEvent />
      </ThreadStation>
      <ThreadStation>
        <NumbersStation />
      </ThreadStation>
      <ThreadStation>
        <EventsShowcase />
      </ThreadStation>
      <ThreadStation>
        <ServicesOrbit />
      </ThreadStation>
      <ThreadStation>
        <Partners />
      </ThreadStation>
      <ThreadStation>
        <CTA />
      </ThreadStation>
    </ScrollThread>
  );
}
