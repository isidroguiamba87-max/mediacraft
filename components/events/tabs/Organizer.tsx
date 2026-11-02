import { getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { detectSocialLink } from "@/components/ui/SocialIcons";
import { cn, initials } from "@/lib/utils";
import type { PulseOrganizedBy, PulsePartnershipSection } from "@/lib/pulse/types";

/**
 * "Organizador" — merged with the old separate "Parceiros" tab (2026-10-01,
 * user request: fewer screens within one event) into a single tab:
 * `organizedBy` on top, `partnershipSections` below. Each half keeps its
 * own empty state so an event with an organizer but no partners (or vice
 * versa) still reads clearly, rather than the whole tab just vanishing.
 */
export async function Organizer({
  organizedBy,
  partnershipSections,
}: {
  organizedBy: PulseOrganizedBy;
  partnershipSections: PulsePartnershipSection[];
}) {
  const t = await getTranslations("eventTabs");

  return (
    <div className="flex flex-col gap-12">
      <OrganizerCard organizedBy={organizedBy} t={t} />
      <PartnersSection sections={partnershipSections} t={t} />
    </div>
  );
}

function OrganizerCard({
  organizedBy,
  t,
}: {
  organizedBy: PulseOrganizedBy;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (!organizedBy?.name) {
    return <p className="text-sm text-slate">{t("organizerEmpty")}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-brand border border-line p-5 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {organizedBy.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
          <img
            src={organizedBy.photoUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-navy font-display text-xl text-white">
            {initials(organizedBy.name)}
          </span>
        )}
        <div className="min-w-0 w-full">
          <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-brand-red uppercase">
            {t("organizerLabel")}
          </p>
          <h3 className="mt-1 font-display text-xl text-brand-navy">{organizedBy.name}</h3>
          {organizedBy.description && (
            <SafeHtml html={organizedBy.description} className="mt-2 text-sm text-slate" />
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {organizedBy.mail && (
              <a
                href={`mailto:${organizedBy.mail}`}
                className="flex items-center gap-2 text-sm font-medium break-all text-brand-navy hover:text-brand-red"
              >
                <Mail size={15} className="shrink-0 text-brand-red" />
                {organizedBy.mail}
              </a>
            )}
            {organizedBy.phone && (
              <a
                href={`tel:${organizedBy.phone}`}
                className="flex items-center gap-2 text-sm font-medium text-brand-navy hover:text-brand-red"
              >
                <Phone size={15} className="shrink-0 text-brand-red" />
                {organizedBy.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A section can exist with zero partnerships in it (an organizer created
 * the section but hasn't added logos yet) — that's shown as an empty
 * section, not hidden, so it's clear the section is there and just not
 * filled in. */
function PartnersSection({
  sections,
  t,
}: {
  sections: PulsePartnershipSection[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const withContent = sections.filter((s) => s.title);

  if (withContent.length === 0) {
    return <p className="text-sm text-slate">{t("partnersEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-10 border-t border-line pt-10">
      {withContent.map((section, i) => (
        <div key={`${section.title}-${i}`}>
          <h3 className="font-display text-lg text-brand-navy">{section.title}</h3>
          {section.partnerships.length === 0 ? (
            <p className="mt-3 text-sm text-slate">{t("partnersSectionEmpty")}</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {section.partnerships.map((p, j) => {
                const platform = p.link ? detectSocialLink(p.link) : null;
                const card = (
                  <div className="flex w-full items-center gap-3 rounded-brand border border-line p-3 transition-shadow hover:shadow-brand sm:w-auto">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote Pulse media, host not finalized yet
                      <img
                        src={p.logoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-brand object-contain"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brand bg-brand-navy font-display text-xs text-white">
                        {initials(p.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-navy">{p.name}</p>
                      {p.caption && <p className="truncate text-xs text-slate">{p.caption}</p>}
                      {platform && (
                        <span
                          title={platform.label}
                          className={cn(
                            "mt-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
                            platform.badgeClassName,
                          )}
                        >
                          <platform.Icon size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                );
                return p.link ? (
                  <a
                    key={j}
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={j} className="w-full shrink-0 sm:w-auto">
                    {card}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
