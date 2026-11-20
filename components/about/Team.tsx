import { useTranslations } from "next-intl";
import { TeamDeck } from "./TeamDeck";

/**
 * "A nossa equipa" (2026-11-19 mock-up): a full-width navy band carrying
 * the uppercase white title, then the portrait deck on white.
 */
export function Team() {
  const t = useTranslations("team");

  return (
    <section>
      <div className="bg-brand-navy">
        <div className="mx-auto max-w-container px-6 py-5 sm:py-6 lg:px-10">
          <h2 className="font-body text-2xl leading-none font-bold tracking-wide text-white uppercase sm:text-4xl">
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="mx-auto max-w-container px-6 pb-4 sm:pb-6 lg:px-10">
        <TeamDeck />
      </div>
    </section>
  );
}
