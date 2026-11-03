"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/config/i18n";

const STORAGE_KEY = "mediacraft-cookie-consent";

// Same exclusion as ConditionalFooter: the event detail page is a fixed-
// height frame on mobile where "nothing should appear or shift below the
// event content" (2026-10-09) — a fixed banner popping up over it would
// break that.
const EVENT_DETAIL_PATTERN = /^\/eventos\/[^/]+$/;

/** Shown once, until the visitor picks either option — stored in
 * localStorage, not a cookie itself (no server needs to read this choice
 * right now; the site has no cookie-based analytics to gate behind it
 * yet, see docs/CHECKLIST-SEGURANCA.md A11). Reading localStorage can
 * throw (private browsing, blocked storage) — treated the same as "no
 * decision yet" either way, so the banner just shows again next visit
 * instead of crashing. */
export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hasDecision = false;
    try {
      hasDecision = Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      // Private browsing / storage blocked — show it; worst case it
      // reappears next visit too, same tradeoff NetworkingPrompt makes.
    }
    const id = setTimeout(() => setVisible(!hasDecision), 0);
    return () => clearTimeout(id);
  }, []);

  if (EVENT_DETAIL_PATTERN.test(pathname)) return null;

  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage blocked — the banner just reappears next visit, harmless.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("message")}
      className="fixed inset-x-0 bottom-16 z-40 mx-3 mb-3 rounded-brand border border-line bg-paper p-4 shadow-brand sm:mx-auto sm:max-w-xl md:bottom-0 md:mb-4"
    >
      <p className="text-sm text-ink">
        {t("message")}{" "}
        <Link href="/politica-privacidade" className="font-medium text-brand-red hover:underline">
          {t("learnMore")}
        </Link>
      </p>
      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="rounded-brand bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red-deep"
        >
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="rounded-brand border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}
