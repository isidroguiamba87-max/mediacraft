import { useTranslations } from "next-intl";
import { Award, Eye, Target, type LucideIcon } from "lucide-react";

const VALUE_KEYS = ["boldness", "inclusion", "curiosity", "empathy"] as const;

/** White rounded card with a soft grey edge and drop shadow (mock-up). */
const cardClass =
  "rounded-[1.5rem] border border-black/15 bg-white px-5 py-6 shadow-[2px_4px_10px_rgba(0,0,0,0.18)] sm:px-6 sm:py-7";

function CardHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-body text-lg font-bold text-brand-navy">
      <Icon aria-hidden className="h-6 w-6 shrink-0 text-brand-red" strokeWidth={2.5} />
      {children}
    </h2>
  );
}

/**
 * Missão, Visão and Os nossos valores as three stacked full-width cards
 * right under the Intro (2026-11-11 mock-up): red icon + bold navy title,
 * then the text; each value as a red name over its description.
 */
export function MissionVision() {
  const t = useTranslations("about");

  return (
    <section className="bg-white pb-14 sm:pb-20">
      <div className="mx-auto flex max-w-container flex-col gap-6 px-6 sm:gap-8 lg:px-10">
        {(["mission", "vision"] as const).map((id) => (
          <article key={id} className={cardClass}>
            <CardHeading icon={id === "mission" ? Target : Eye}>{t(`${id}.title`)}</CardHeading>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink sm:text-justify sm:text-[15px]">
              {t(`${id}.text`)}
            </p>
          </article>
        ))}

        <article className={cardClass}>
          <CardHeading icon={Award}>{t("values.title")}</CardHeading>
          <dl className="mt-4 flex flex-col gap-4 sm:gap-5">
            {VALUE_KEYS.map((key) => (
              <div key={key}>
                <dt className="font-body text-[15px] font-medium text-brand-red">
                  {t(`values.items.${key}.title`)}
                </dt>
                <dd className="font-body text-sm leading-relaxed text-ink sm:text-[15px]">
                  {t(`values.items.${key}.description`)}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  );
}
