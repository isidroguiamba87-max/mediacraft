import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactInfo } from "@/components/contact/ContactInfo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return { title: t("title"), description: t("description") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-4xl text-brand-navy">{t("title")}</h1>
        <p className="mt-4 text-base text-slate">{t("subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ContactForm />
        <ContactInfo />
      </div>
    </div>
  );
}
