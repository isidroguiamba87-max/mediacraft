"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/config/i18n";
import { buttonVariants } from "@/components/ui/Button";

/**
 * Catches any render/server error inside a locale route that isn't a 404
 * (see not-found.tsx for that). Never shows `error.message` or a stack
 * trace to the visitor — only Next's own `error.digest`, which is the
 * correlation id to look up in Vercel's runtime logs for the real cause.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-container flex-col items-center px-6 py-32 text-center lg:px-10">
      <p className="font-display text-6xl text-brand-red">!</p>
      <h1 className="mt-4 font-display text-2xl text-brand-navy">{t("title")}</h1>
      <p className="mt-2 text-slate">{t("subtitle")}</p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate/70">
          {t("errorId")}: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={buttonVariants("primary", "md")}>
          {t("retry")}
        </button>
        <Link href="/" className={buttonVariants("ghost", "md")}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
