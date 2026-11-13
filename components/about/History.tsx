import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * "A nossa história" (2026-11-11 mock-up): uppercase navy heading with the
 * long red rule, the red one-line subtitle, the whole narrative shown in
 * full (justified — no more "ler mais"), then a white rounded card closing
 * it out: quote + founders' sign-off on the left, their photo on the right.
 */
export function History() {
  const t = useTranslations("about");
  const th = useTranslations("about.history");
  const paragraphs = th.raw("paragraphs") as string[];

  return (
    <section id="historia" className="bg-white pb-16 sm:pb-24">
      <div className="mx-auto max-w-container px-6 lg:px-10">
        <h2 className="inline-block border-b-[1.5px] border-brand-red pr-16 pb-2 font-body text-3xl leading-none font-bold tracking-tight text-brand-navy uppercase sm:text-4xl">
          {th("eyebrow")}
        </h2>

        <p className="mt-5 font-body text-base font-bold text-brand-red sm:text-lg">
          {th("title").replace(/\.$/, "")}
        </p>

        <div className="mt-5 flex flex-col gap-5 font-body text-sm leading-relaxed text-ink sm:text-justify sm:text-[15px]">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <QuoteCard quote={t("quote")} signatureRole={t("signatureRole")} />
      </div>
    </section>
  );
}

function QuoteCard({ quote, signatureRole }: { quote: string; signatureRole: string }) {
  return (
    <figure className="mt-10 grid overflow-hidden rounded-[1.5rem] border border-black/15 bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.18)] sm:mt-12 md:grid-cols-[1fr_1.15fr]">
      <div className="flex flex-col justify-center px-7 py-8 sm:px-10 sm:py-10">
        <span aria-hidden className="font-display text-5xl leading-none text-brand-red">
          “
        </span>
        <blockquote className="mt-1 font-body text-xl leading-snug text-brand-navy italic sm:text-2xl">
          {quote}
        </blockquote>
        <figcaption className="mt-6">
          <span aria-hidden className="mb-3 block h-0.5 w-8 bg-brand-red" />
          <p className="font-body text-sm font-bold text-brand-navy">-Linda e Vanessa</p>
          <p className="font-body text-sm text-brand-navy">{signatureRole}</p>
        </figcaption>
      </div>

      <div className="relative min-h-[16rem] md:min-h-[20rem]">
        <Image
          src="/images/about/founders.jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          style={{ objectPosition: "50% 30%" }}
          className="object-cover md:rounded-l-[1.5rem]"
        />
      </div>
    </figure>
  );
}
