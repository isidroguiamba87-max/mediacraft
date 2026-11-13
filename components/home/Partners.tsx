"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { partners } from "@/content/partners";
import { Marquee } from "@/components/ui/Marquee";
import { cn } from "@/lib/utils";
import type { Partner } from "@/types";

/** Logo when one is set, otherwise the partner's name as a text mark. Logo
 * sized to fill most of the card's height (2026-10-01: was capped at 40px
 * in an 80px-tall card, looked tiny with lots of dead space around it).
 * White card (not grey) with a subtle brand-red border, rather than a
 * plain neutral one — reads as "on brand" without tinting every partner's
 * own logo colors. */
function PartnerMark({ partner, className }: { partner: Partner; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[1.25rem] border border-brand-red bg-white px-5 py-3",
        className,
      )}
    >
      {partner.logo ? (
        <Image
          src={partner.logo}
          alt={partner.name}
          width={200}
          height={80}
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      ) : (
        <span className="text-center font-display text-sm font-semibold text-brand-navy">{partner.name}</span>
      )}
    </div>
  );
}

export function Partners() {
  const t = useTranslations("partners");

  return (
    <section className="mx-auto max-w-container px-6 pt-14 pb-12 sm:pt-20 sm:pb-14 lg:px-10">
      <h2 className="inline-block border-b-[1.5px] border-brand-red pb-2 font-body text-2xl leading-none font-bold tracking-tight text-brand-navy sm:text-3xl">
        {t("title")}
      </h2>

      <Marquee className="mt-8 sm:mt-10">
        {partners.map((p) => (
          <PartnerMark key={p.id} partner={p} className="h-20 w-40 sm:h-24 sm:w-52" />
        ))}
      </Marquee>
    </section>
  );
}
