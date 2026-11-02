import { useTranslations } from "next-intl";
import { services } from "@/content/services";
import { Card } from "@/components/ui/Card";

export function Services() {
  const t = useTranslations("services");

  return (
    <section className="mx-auto max-w-container px-6 py-20 lg:px-10">
      <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-wide text-brand-navy uppercase sm:text-4xl">
        {t("eyebrow")}
      </h2>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {services.map(({ id, icon: Icon }) => (
          <Card key={id} className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Icon size={20} />
            </div>
            <h3 className="font-display text-lg text-brand-navy">
              {t(`items.${id}.title`)}
            </h3>
            <p className="mt-2 text-sm text-slate">{t(`items.${id}.description`)}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
