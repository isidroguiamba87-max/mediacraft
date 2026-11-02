"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { LinkedinIcon, WhatsappIcon } from "@/components/ui/SocialIcons";
import { initials } from "@/lib/utils";
import type { TeamMember } from "@/types";

export function TeamCard({ member }: { member: TeamMember }) {
  const t = useTranslations("team.members");
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="flex flex-col items-center rounded-brand border border-line p-6 text-center transition-shadow hover:shadow-brand"
    >
      {member.photo ? (
        <Image
          src={member.photo}
          alt={member.name}
          width={96}
          height={96}
          className="rounded-full"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-navy font-display text-2xl text-white">
          {initials(member.name)}
        </div>
      )}
      <p className="mt-4 font-display text-base text-brand-navy">{member.name}</p>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden"
          >
            <p className="mt-2 text-sm text-slate">{t(`${member.id}.role`)}</p>
            <div className="mt-3 flex justify-center gap-2">
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate hover:text-brand-red"
                >
                  <LinkedinIcon size={16} />
                </a>
              )}
              {member.whatsapp && (
                <a
                  href={member.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate hover:text-brand-red"
                >
                  <WhatsappIcon size={16} />
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  aria-label="Email"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate hover:text-brand-red"
                >
                  <Mail size={16} />
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          <p className="mt-1 text-xs text-slate/70">···</p>
        )}
      </AnimatePresence>
    </button>
  );
}
