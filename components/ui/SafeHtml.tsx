import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "div", "span", "br",
  "ul", "ol", "li",
  "a", "strong", "b", "em", "i", "u",
  "img",
];

/**
 * Organizer-authored rich text (confirmed live 2026-09-16 against the
 * staging Pulse API: `Event.details` comes back as real HTML from a
 * WYSIWYG editor in Pulse Admin, e.g. `<h1><b>...</b></h1>`, not plain
 * text) has to be sanitized before rendering — it's attacker-controlled
 * from our site's point of view (a compromised or malicious organizer
 * account could otherwise inject a stored XSS payload seen by every
 * visitor). Used for `Event.details`, `Ticket.details`,
 * `AgendaSession.description`, `OrganizedBy.description`,
 * `Partnership.caption` — anywhere Pulse hands us organizer free text.
 */
export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
  });
  return (
    <div
      className={cn(
        "[&_h1]:font-display [&_h1]:text-xl [&_h1]:font-bold",
        "[&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold",
        "[&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold",
        "[&_p]:mt-2 [&_p]:first:mt-0",
        "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-semibold [&_b]:font-semibold",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
