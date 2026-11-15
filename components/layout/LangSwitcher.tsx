"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link, usePathname, routing, localeLabels, type Locale } from "@/config/i18n";
import { cn } from "@/lib/utils";

/** Round flag per locale (2026-11-13, client's flags in public/flags/ —
 * the UK one drawn as SVG instead of the supplied stock JPG, which carried
 * a Dreamstime watermark/licence). */
const FLAGS: Record<Locale, string> = {
  pt: "/flags/pt.png",
  en: "/flags/gb.svg",
  fr: "/flags/fr.png",
};

function Flag({ locale, size }: { locale: Locale; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static icon
    <img
      src={FLAGS[locale]}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgba(0,27,50,0.12)]"
      style={{ width: size, height: size }}
    />
  );
}

/** Language dropdown: the current language's round flag + a chevron in a
 * small circle (client screenshot, 2026-11-13), opening a menu of the three
 * languages (flag + name). Keeps the current path when switching. */
export function LangSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("langSwitcher")}
        className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white py-1 pr-1.5 pl-1.5 text-ink shadow-sm hover:bg-paper-2"
      >
        <Flag locale={locale} size={28} />
        <span className="sr-only">{localeLabels[locale]}</span>
        <span className="grid h-6 w-6 place-items-center rounded-full border border-brand-navy/70">
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-12 right-0 z-40 w-40 overflow-hidden rounded-brand border border-line bg-paper shadow-brand"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                role="option"
                aria-selected={l === locale}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-paper-2",
                  l === locale ? "font-semibold text-brand-red" : "text-ink",
                )}
              >
                <Flag locale={l} size={22} />
                {localeLabels[l]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
