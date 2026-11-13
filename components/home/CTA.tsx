import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/config/i18n";
import { MouseGlow } from "@/components/ui/MouseGlow";

export function CTA() {
  const t = useTranslations("cta");

  return (
    <section className="mx-auto max-w-container px-6 pb-20 lg:px-10">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-brand-navy px-6 py-10 text-center text-white sm:px-16 sm:py-12">
        <MouseGlow />
        <div className="relative flex flex-col items-center">
          <h2 className="font-body text-2xl leading-tight font-bold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 max-w-3xl font-body text-base leading-snug text-balance text-white italic sm:mt-4 sm:text-xl">
            {t("subtitle")}
          </p>
          <Link
            href="/#contacto"
            className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-brand-red px-7 py-3 font-body text-base font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-10 sm:text-lg"
          >
            {t("button")}
            <ChevronRight aria-hidden className="h-6 w-6" strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}
