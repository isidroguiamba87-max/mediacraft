"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { partners } from "@/content/partners";
import { SectionHead } from "@/components/ui/SectionHead";
import { Marquee } from "@/components/ui/Marquee";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
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
        "flex shrink-0 items-center justify-center rounded-brand border border-brand-red/15 bg-white px-2.5 py-1.5 transition-colors hover:border-brand-red/40",
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
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto max-w-container px-6 py-14 sm:py-20 lg:px-10">
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} align="center" className="mx-auto" />

      <Marquee className="mt-8 sm:mt-12">
        {partners.map((p) => (
          <PartnerMark key={p.id} partner={p} className="h-16 w-32 sm:h-20 sm:w-44" />
        ))}
      </Marquee>

      <div className="mt-6 flex justify-center sm:mt-10">
        <Button variant="ghost" onClick={() => setOpen(true)}>
          {t("viewAll")}
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("modalTitle")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {partners.map((p) => (
            <PartnerMark key={p.id} partner={p} className="h-20" />
          ))}
        </div>
      </Modal>
    </section>
  );
}
