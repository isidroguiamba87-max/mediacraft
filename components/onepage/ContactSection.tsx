import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { siteConfig } from "@/config/site.config";

/** #contacto on the one-page home — navy info card + form, then the map
 * (same pieces the old /contacto page used). */
export async function ContactSection() {
  const [t, tInfo] = await Promise.all([getTranslations("contact"), getTranslations("contact.info")]);
  const q = encodeURIComponent(siteConfig.contact.mapQuery);

  return (
    <div className="mx-auto max-w-container px-6 py-14 sm:py-20 lg:px-10">
      <div className="inline-block">
        <h2 className="text-brand-navy">
          <span className="font-body text-4xl font-bold sm:text-5xl">{t("pageTitle")}</span>
        </h2>
        <span aria-hidden className="mt-3 block h-px w-[calc(100%+0.75rem)] bg-brand-red" />
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)]">
        <ContactInfo />
        <ContactForm />
      </div>

      <div className="relative mt-5 h-[280px] overflow-hidden rounded-[1.75rem] bg-paper-2 sm:h-[340px]">
        <iframe
          title={tInfo("mapTitle")}
          src={`https://www.google.com/maps?q=${q}&z=15&output=embed`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
