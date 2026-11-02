import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";
import { MouseGlow } from "@/components/ui/MouseGlow";

export function CTA() {
  const t = useTranslations("cta");

  return (
    <section className="mx-auto max-w-container px-6 pb-20 lg:px-10">
      <div className="relative overflow-hidden rounded-brand bg-brand-navy px-8 py-16 text-center text-white sm:px-16">
        <MouseGlow />
        <div className="relative flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl sm:text-4xl">{t("title")}</h2>
          <p className="max-w-xl text-white/70">{t("subtitle")}</p>
          <Link href="/contacto" className={buttonVariants("primary", "lg")}>
            {t("button")}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
