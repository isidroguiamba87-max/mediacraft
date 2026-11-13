import Image from "next/image";
import { useTranslations } from "next-intl";
import introPhoto from "@/public/images/about/intro-evento.png";

/**
 * The About page's opening section (2026-11-11 mock-up): an uppercase
 * "SOBRE NÓS" heading with the red rule, then a rounded card — the event
 * group photo under a navy wash, with the tagline in caps and the intro
 * paragraph (justified) centred over it.
 */
export function Intro() {
  const t = useTranslations("about");
  const tNav = useTranslations("nav");
  // The mock-up sets the tagline as one clause: "…, cultiva-se" — no dash,
  // no full stop.
  const tagline = t("title")
    .replace(/\s*—\s*/, ", ")
    .replace(/\.$/, "")
    // Non-breaking hyphen so "cultiva-se" never splits across lines.
    .replace(/-/g, "‑");

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-container px-6 pt-12 pb-14 sm:pt-16 sm:pb-20 lg:px-10">
        <h2 className="inline-block border-b-[1.5px] border-brand-red pb-2 font-body text-3xl leading-none font-bold tracking-tight text-brand-navy uppercase sm:text-4xl">
          {tNav("about")}
        </h2>

        <div className="relative mt-6 flex min-h-[26rem] items-center overflow-hidden rounded-[1.25rem] bg-brand-navy sm:mt-8 sm:aspect-[16/9] sm:min-h-0">
          <Image
            src={introPhoto}
            alt=""
            aria-hidden
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
          />
          <span aria-hidden className="absolute inset-0 bg-[#1b2350]/75" />

          <div className="relative mx-auto max-w-5xl px-6 py-12 sm:px-12">
            <h2 className="text-center font-body text-2xl leading-tight font-bold tracking-wide text-balance text-white uppercase sm:text-3xl lg:text-4xl">
              {tagline}
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-center text-balance text-white/90 sm:mt-5 sm:text-base">
              {t("intro")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
