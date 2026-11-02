"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";
import { useTilt } from "@/hooks/useTilt";

interface TitlePart {
  t: string;
  hl: boolean;
}

export function Hero() {
  const t = useTranslations("hero");
  const reduceMotion = useReducedMotion();
  const { ref: tiltRef, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt();

  // The headline assembles softly, left to right; the three key phrases land in
  // the brand red with a gentle blur-in.
  const parts = useMemo(() => t.raw("titleParts") as TitlePart[], [t]);

  return (
    <section className="overflow-hidden bg-paper-2">
      <div className="mx-auto grid max-w-container items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2 lg:px-10 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-4xl leading-[1.08] text-brand-navy sm:text-5xl lg:text-6xl">
            {parts.map((p, i) => (
              <motion.span
                key={i}
                className={p.hl ? "text-brand-red" : undefined}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, filter: p.hl ? "blur(8px)" : "blur(0px)" }
                }
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {p.t}
              </motion.span>
            ))}
          </h1>
          <p className="mt-6 max-w-lg text-base text-slate sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/eventos" className={buttonVariants("primary", "lg")}>
              {t("primaryCta")}
              <ArrowRight size={18} />
            </Link>
            <Link href="/sobre" className={buttonVariants("ghost", "lg")}>
              {t("secondaryCta")}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="[perspective:1200px]"
        >
          <div
            ref={tiltRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="relative mx-auto aspect-[4/3] w-full max-w-md"
          >
            <motion.div
              style={{ rotateX, rotateY }}
              className="flex h-full w-full flex-col justify-between rounded-brand bg-gradient-to-br from-brand-navy to-brand-navy-2 p-8 text-white shadow-brand [transform-style:preserve-3d]"
            >
              <div className="h-2 w-14 rounded-full bg-brand-red" />
              <div>
                <p className="font-display text-4xl sm:text-5xl">{t("cardTitle")}</p>
                <p className="mt-3 max-w-[220px] text-sm text-white/70">
                  {t("cardSubtitle")}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
