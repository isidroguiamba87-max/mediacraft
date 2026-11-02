import { useTranslations } from "next-intl";
import { Mail, MapPin } from "lucide-react";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { siteConfig } from "@/config/site.config";

export function ContactInfo() {
  const t = useTranslations("contact.info");

  return (
    <div className="rounded-brand border border-line bg-paper-2 p-8">
      <h3 className="font-display text-xl text-brand-navy">{t("title")}</h3>

      <ul className="mt-6 flex flex-col gap-5 text-sm">
        <li className="flex items-start gap-3">
          <Mail size={18} className="mt-0.5 shrink-0 text-brand-red" />
          <div>
            <p className="text-xs text-slate">{t("email")}</p>
            <a href={`mailto:${siteConfig.contact.email}`} className="text-ink hover:text-brand-red">
              {siteConfig.contact.email}
            </a>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand-red" />
          <div>
            <p className="text-xs text-slate">{t("address")}</p>
            <p className="text-ink">{siteConfig.contact.address}</p>
          </div>
        </li>
      </ul>

      <div className="mt-8">
        <p className="mb-3 text-xs text-slate">{t("social")}</p>
        <div className="flex gap-3">
          <a
            href={siteConfig.contact.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-paper"
          >
            <LinkedinIcon size={18} />
          </a>
          <a
            href={siteConfig.contact.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-paper"
          >
            <InstagramIcon size={18} />
          </a>
          <a
            href={siteConfig.contact.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-paper"
          >
            <FacebookIcon size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
