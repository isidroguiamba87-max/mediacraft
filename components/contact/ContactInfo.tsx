import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { siteConfig } from "@/config/site.config";

/**
 * Left card of /contacto (client design 2026-11-11): deep navy panel, two
 * intro paragraphs, four info rows (white rounded tile with a red icon,
 * bold caps label, small value) split by hairlines, and the social marks
 * as white tiles bottom-right.
 */
export function ContactInfo() {
  const t = useTranslations("contact.info");
  const { contact } = siteConfig;

  const rows: { icon: ReactNode; label: string; value: ReactNode }[] = [
    {
      icon: <MapPin size={22} fill="currentColor" stroke="white" strokeWidth={1.6} />,
      label: t("office"),
      value: contact.office,
    },
    {
      icon: <Phone size={20} fill="currentColor" strokeWidth={0} />,
      label: t("phones"),
      value: contact.phones.map((p, i) => (
        <span key={p}>
          {i > 0 && " / "}
          <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-white">
            {p}
          </a>
        </span>
      )),
    },
    {
      icon: <Mail size={22} strokeWidth={2} />,
      label: t("emailAddr"),
      value: (
        <a href={`mailto:${contact.email}`} className="hover:text-white">
          {contact.email}
        </a>
      ),
    },
    {
      icon: <Clock size={22} strokeWidth={2.2} />,
      label: t("hours"),
      value: t("hoursValue"),
    },
  ];

  const socials = [
    { href: contact.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: contact.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: contact.social.facebook, label: "Facebook", Icon: FacebookIcon },
  ];

  return (
    <div className="flex flex-col rounded-[1.75rem] bg-brand-navy font-body px-7 pt-9 pb-6 text-white sm:px-12">
      <div className="space-y-5 text-[15px] leading-snug sm:text-base">
        <p>{t("intro1")}</p>
        <p>{t("intro2")}</p>
      </div>

      <ul className="mt-7">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={`flex items-center gap-4 py-4 ${i < rows.length - 1 ? "border-b border-white/45" : ""}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-brand-red">
              {r.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.02em] uppercase">{r.label}</p>
              <p className="mt-1 text-xs text-white/85">{r.value}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex justify-end gap-2 pt-4">
        {socials.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid h-11 w-11 place-items-center rounded-md bg-white text-brand-navy transition-opacity hover:opacity-85"
          >
            <Icon size={26} />
          </a>
        ))}
      </div>
    </div>
  );
}
