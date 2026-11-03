import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/config/i18n";
import type { PulseEventDetail } from "@/lib/pulse/types";
import type { TeamMember } from "@/types";

/** Loose on purpose — schema.org has no official TS types in this project
 * (adding `schema-dts` just for this would be a new dependency for a
 * handful of plain object literals), and every caller here builds a
 * literal object by hand, so there's nothing a stricter type would catch. */
type JsonLd = Record<string, unknown>;

const LOGO_URL = `${siteConfig.url}/icon.png`;

function absoluteUrl(locale: Locale, path: string): string {
  return `${siteConfig.url}/${locale}${path}`;
}

/**
 * The company itself — injected once, site-wide (see app/[locale]/layout.tsx),
 * not per-page. `@id` lets other schemas (Event's organizer, etc.) reference
 * this same entity instead of repeating it, which is the pattern Google's
 * docs recommend for a small site with one real-world business behind it.
 *
 * No `telephone` — there's no company phone number anywhere in
 * config/site.config.ts or the contact page to pull one from; add it there
 * first if MediaCraft gets a public line.
 */
export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: LOGO_URL,
    image: LOGO_URL,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressCountry: "MZ",
    },
    sameAs: [
      siteConfig.contact.social.linkedin,
      siteConfig.contact.social.instagram,
      siteConfig.contact.social.facebook,
    ],
  };
}

/** The site as a whole — no `potentialAction`/`SearchAction` (sitelinks
 * search box) because there's no site search to point it at; add one here
 * if a search feature ever ships. */
export function websiteSchema(locale: Locale): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: absoluteUrl(locale, ""),
    inLanguage: locale,
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

/** `items`: site-relative paths (e.g. `""` for home, `"/eventos"`), in
 * breadcrumb order — home is prepended automatically. */
export function breadcrumbSchema(
  locale: Locale,
  items: { name: string; path: string }[],
): JsonLd {
  const trail = [{ name: siteConfig.name, path: "" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

/** `plainDetails`: the event's `details` HTML, already stripped to plain
 * text by the caller (stripHtml) — schema.org `description` wants plain
 * text, and every page that would call this already computes that string
 * for its own meta description. */
export function eventSchema(
  event: PulseEventDetail,
  eventId: string,
  locale: Locale,
  plainDetails?: string,
): JsonLd {
  const sorted = [...event.scheduleDates].sort(
    (a, b) => a.date.localeCompare(b.date) || a.timeFrom.localeCompare(b.timeFrom),
  );
  const first = sorted[0];
  const startDate = first ? `${first.date.slice(0, 10)}T${first.timeFrom || "00:00"}:00` : undefined;
  const ends = event.scheduleDates
    .map((d) => new Date(`${d.date.slice(0, 10)}T${d.timeTo || "23:59"}:00`).getTime())
    .filter((t) => Number.isFinite(t));
  const endDate = ends.length ? new Date(Math.max(...ends)).toISOString() : undefined;

  const isOnline = Boolean(event.location.eventLink) && !event.location.address;
  const location = isOnline
    ? { "@type": "VirtualLocation", url: event.location.eventLink }
    : {
        "@type": "Place",
        name: event.location.name,
        address: event.location.address
          ? {
              "@type": "PostalAddress",
              streetAddress: event.location.address.avenue,
              addressLocality: event.location.address.city,
              addressRegion: event.location.address.province,
              addressCountry: "MZ",
            }
          : undefined,
      };

  const isFree = event.tickets.length === 0 || event.tickets.every((t) => t.price === 0);
  const offers = event.tickets.length
    ? event.tickets.map((t) => ({
        "@type": "Offer",
        name: t.title,
        price: t.price,
        priceCurrency: "MZN",
        availability:
          t.state === "SOLD_OUT" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: absoluteUrl(locale, `/eventos/${eventId}`),
      }))
    : isFree
      ? [
          {
            "@type": "Offer",
            price: 0,
            priceCurrency: "MZN",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(locale, `/eventos/${eventId}`),
          },
        ]
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: plainDetails,
    startDate,
    endDate,
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location,
    image: event.coverUrl ? [event.coverUrl] : undefined,
    organizer: event.organizedBy?.name
      ? { "@type": "Organization", name: event.organizedBy.name, email: event.organizedBy.mail ?? undefined }
      : { "@id": `${siteConfig.url}/#organization` },
    offers,
  };
}

/** One per team member, used on /sobre — `@id` ties each Person to the
 * Organization as `worksFor`, same pattern as eventSchema's organizer. */
export function personSchema(member: TeamMember, role: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    jobTitle: role,
    image: member.photo ? `${siteConfig.url}${member.photo}` : undefined,
    email: member.email,
    sameAs: member.linkedin ? [member.linkedin] : undefined,
    worksFor: { "@id": `${siteConfig.url}/#organization` },
  };
}

/** The five service lines on the home page, as one `@graph` of `Service`
 * entities sharing the same provider. */
export function servicesSchema(services: { title: string; description: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": services.map((s) => ({
      "@type": "Service",
      name: s.title,
      description: s.description,
      provider: { "@id": `${siteConfig.url}/#organization` },
      areaServed: "MZ",
    })),
  };
}
