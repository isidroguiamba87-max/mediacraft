"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";
import { Link, usePathname, routing, localeLabels, type Locale } from "@/config/i18n";
import { cn } from "@/lib/utils";

/** Language dropdown: shows the current locale, opens a menu with the
 * three supported languages, keeps the current path when switching. */
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
        className="flex h-10 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium text-ink hover:bg-paper-2"
      >
        <Globe size={16} />
        <span className="uppercase">{locale}</span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
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
                  "block px-4 py-2.5 text-sm hover:bg-paper-2",
                  l === locale ? "font-semibold text-brand-red" : "text-ink",
                )}
              >
                {localeLabels[l]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
