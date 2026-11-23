import { useTranslations } from "next-intl";

/**
 * The About page's opening section (2026-11-11 mock-up): an uppercase
 * "SOBRE NÓS" heading with the red rule, then a compact solid navy rounded
 * card (2026-11-19: the group photo was dropped) with the tagline in caps
 * and the intro paragraph (justified).
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
    // Sits on the event photo backdrop (see the home page's #sobre-nos).
    <section>
      <div className="mx-auto max-w-container px-6 pt-8 pb-6 sm:pt-12 sm:pb-8 lg:px-10">
        <h2 className="inline-block border-b-[1.5px] border-white/80 pb-2 font-body text-3xl leading-none font-bold tracking-tight text-white uppercase sm:text-4xl">
          {tNav("about")}
        </h2>

        {/* Client design 2026-11-19: no photo — a compact solid navy card,
            tagline in caps, the intro justified underneath. */}
        <div className="mt-6 rounded-[1.25rem] border border-white/15 bg-white/[0.07] backdrop-blur-sm px-6 py-10 text-white sm:mt-8 sm:rounded-[1.5rem] sm:px-12 sm:py-12 lg:px-14">
          <h3 className="text-center text-white">
            <span className="block font-body text-2xl leading-tight font-bold tracking-wide text-balance uppercase sm:text-3xl lg:text-4xl">
              {tagline}
            </span>
          </h3>
          <p className="mx-auto mt-5 max-w-5xl font-body text-sm leading-relaxed text-justify text-white/90 hyphens-auto sm:text-base">
            {t("intro")}
          </p>
        </div>
      </div>
    </section>
  );
}
