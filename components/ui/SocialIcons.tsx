/**
 * Minimal brand marks for LinkedIn / Instagram / Facebook / WhatsApp /
 * YouTube / TikTok / X. lucide-react dropped all brand/social icons, so
 * these fill the gap — same props shape (`size`, `className`) as a lucide
 * icon for drop-in use.
 */
interface IconProps {
  size?: number;
  className?: string;
}

export function LinkedinIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-.98 1.83-2.02 3.77-2.02 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.02-3.06-1.94-3.06-1.94 0-2.24 1.44-2.24 2.96V21h-4V9Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.35c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.4-3.9 4V10.4H8.4v3h2.96V21h2.14Z" />
    </svg>
  );
}

export function WhatsappIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.02 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.4 1.26 4.83L2 22l5.34-1.28a9.9 9.9 0 0 0 4.68 1.19h.01c5.5 0 9.96-4.46 9.96-9.96S17.53 2 12.02 2Zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.36-.5.06-1.12.08-1.8-.12-.42-.12-.96-.3-1.64-.6-2.9-1.25-4.8-4.18-4.94-4.38-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.6.83 2.06.9 2.21.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.13.07.71-.17 1.39Z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .4-4.8 29 29 0 0 0-.4-4.8ZM10 15.3V8.7l5.6 3.3-5.6 3.3Z" />
    </svg>
  );
}

export function TiktokIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.6 2h-3.2v13.4a2.9 2.9 0 1 1-2.1-2.8v-3.3a6.2 6.2 0 1 0 5.3 6.1V8.9a7.9 7.9 0 0 0 4.6 1.5V7.2a4.7 4.7 0 0 1-4.6-4.6V2Z" />
    </svg>
  );
}

export function XIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.9 10.4 20.4 3h-1.6l-5.6 6.4L8.8 3H3.4l6.8 9.6-6.8 7.4h1.6l6-6.8 4.6 6.8h5.4l-7.1-9.6Zm-2.1 2.4-.7-1L5.6 4.2h2.4l4.4 6.2.7 1 5.8 8.2h-2.4l-4.7-6.6Z" />
    </svg>
  );
}

export type SocialPlatform = {
  Icon: (props: IconProps) => React.JSX.Element;
  label: string;
  /** The platform's own brand color as a filled-badge background, white
   * icon on top — a flat gray badge didn't read as a clickable button at
   * all (2026-10-10: "deves usar as próprias cores da rede social... não
   * dá para ver que é um botão"). Tailwind arbitrary-value classes since
   * these are fixed brand colors, not design-system tokens. */
  badgeClassName: string;
};

/** Sniffs a URL's hostname to pick the matching brand mark — e.g. a
 * partnership's `link` from Pulse can be any of these (2026-10-10:
 * "analisares qual é o link e de que plataforma, e colocar o ícone que
 * identifica essa rede social"), and there's otherwise no way for a
 * visitor to tell a YouTube link from a plain website before clicking.
 * Falls back to a generic external-link mark for anything unrecognized
 * (a personal site, a PDF, ...) rather than showing nothing. */
export function detectSocialLink(url: string): SocialPlatform | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return null;
  }

  if (host === "youtube.com" || host === "youtu.be")
    return { Icon: YoutubeIcon, label: "YouTube", badgeClassName: "bg-[#FF0000] text-white" };
  if (host === "instagram.com")
    return {
      Icon: InstagramIcon,
      label: "Instagram",
      badgeClassName: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white",
    };
  if (host === "facebook.com" || host === "fb.com")
    return { Icon: FacebookIcon, label: "Facebook", badgeClassName: "bg-[#1877F2] text-white" };
  if (host === "linkedin.com")
    return { Icon: LinkedinIcon, label: "LinkedIn", badgeClassName: "bg-[#0A66C2] text-white" };
  if (host === "wa.me" || host === "whatsapp.com")
    return { Icon: WhatsappIcon, label: "WhatsApp", badgeClassName: "bg-[#25D366] text-white" };
  if (host === "tiktok.com")
    return { Icon: TiktokIcon, label: "TikTok", badgeClassName: "bg-black text-white" };
  if (host === "twitter.com" || host === "x.com")
    return { Icon: XIcon, label: "X", badgeClassName: "bg-black text-white" };
  return { Icon: ExternalLinkIcon, label: host, badgeClassName: "bg-brand-navy text-white" };
}

function ExternalLinkIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  );
}
