"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/**
 * Whole-page machine translation (2026-11-17: "traduzir toda a página
 * mesmo com as coisas que não estão… como o Google Tradutor").
 *
 * The site's own copy is already translated by next-intl, but a lot of
 * what's on screen isn't ours to translate ahead of time — event titles,
 * descriptions, programmes and speaker bios from Pulse, news and gallery
 * captions from the admin. When the visitor picks EN or FR, this loads the
 * Google Translate website element, which translates every text node that
 * is still in Portuguese (and keeps translating whatever React renders
 * later — tab switches, carousels, popups). PT never loads it.
 *
 * How it's driven: Google's element reads the `googtrans` cookie
 * (`/pt/en`) on load, so the locale switcher just sets the cookie; going
 * between two non-PT languages, or back to PT, reloads the page once so
 * Google's rewritten DOM is thrown away cleanly rather than half-undone.
 * The Google banner/tooltip are hidden in globals.css.
 */

const ELEMENT_ID = "google_translate_element";
const SOURCE = "pt";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          opts: { pageLanguage: string; includedLanguages?: string; autoDisplay?: boolean },
          id: string,
        ) => unknown;
      };
    };
    __mcTranslateLoaded?: boolean;
    __mcDomPatched?: boolean;
  }
}

function readCookie(): string {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function writeCookie(value: string) {
  const host = window.location.hostname;
  // Google sets it on both the host and the parent domain — write/clear
  // both so a stale copy on one can't win over the other.
  const domains = ["", `; domain=${host}`, `; domain=.${host.split(".").slice(-2).join(".")}`];
  for (const d of domains) {
    document.cookie = value
      ? `googtrans=${value}; path=/${d}`
      : `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${d}`;
  }
}

/**
 * Google Translate wraps text nodes in <font> elements behind React's
 * back; when React later removes/reorders those nodes it throws ("The
 * node to be removed is not a child of this node") and the page breaks.
 * Standard guard (facebook/react#11538): make removeChild/insertBefore
 * tolerate a node that's been moved, instead of throwing.
 */
function patchDomForTranslation() {
  if (window.__mcDomPatched || typeof Node !== "function") return;
  window.__mcDomPatched = true;

  const originalRemove = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      child.parentNode?.removeChild(child);
      return child;
    }
    return originalRemove.call(this, child) as T;
  };

  const originalInsert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) {
      return originalInsert.call(this, node, null) as T;
    }
    return originalInsert.call(this, node, ref) as T;
  };
}

export function AutoTranslate() {
  const locale = useLocale();

  useEffect(() => {
    const wanted = locale === SOURCE ? "" : `/${SOURCE}/${locale}`;
    const current = readCookie();

    if (wanted !== current) writeCookie(wanted);

    // Google's element is already on the page from an earlier language:
    // its DOM rewrites can't be swapped to another language in place, so
    // start fresh.
    if (window.__mcTranslateLoaded) {
      if (wanted !== current) window.location.reload();
      return;
    }

    if (!wanted) return;

    patchDomForTranslation();
    window.googleTranslateElementInit = () => {
      const TE = window.google?.translate?.TranslateElement;
      if (!TE) return;
      new TE({ pageLanguage: SOURCE, includedLanguages: "en,fr", autoDisplay: false }, ELEMENT_ID);
    };
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
    window.__mcTranslateLoaded = true;
  }, [locale]);

  return <div id={ELEMENT_ID} translate="no" aria-hidden className="hidden" />;
}
