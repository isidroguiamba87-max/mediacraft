import { useTranslations } from "next-intl";

/**
 * The About page's opening section — restored to the full-bleed photo
 * background with centred text (2026-10-31: the split hero/CTA layout
 * tried in `Hero.tsx` was reverted — "a ideia era que a imagem era o
 * fundo e o texto ficava por cima centralizado... podes devolver como
 * estava essa parte de cima" — the redesign request that followed was
 * scoped to the Missão/Visão/Valores/História section only, see
 * `History.tsx`). Same photo-plus-navy-wash-plus-white-text treatment
 * EventHero uses: a flat dark overlay stays legible regardless of what's
 * in the photo, unlike a lighter wash would.
 */
export function Intro() {
  const t = useTranslations("about");

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center overflow-hidden bg-brand-navy px-6 py-20 text-center lg:px-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- static public asset */}
      <img
        src="/images/about/team.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span aria-hidden className="absolute inset-0 bg-brand-navy/70" />

      <div className="relative mx-auto max-w-3xl">
        <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">{t("title")}</h2>
        <p className="mx-auto mt-8 max-w-3xl text-base text-white/85 sm:text-lg">{t("intro")}</p>
      </div>
    </section>
  );
}
