import { useTranslations } from "next-intl";
import { Handshake, Globe2, Radio, Users } from "lucide-react";

const STAT_KEYS = ["partners", "countries", "channels", "participants"] as const;
const STAT_ICONS = { partners: Handshake, countries: Globe2, channels: Radio, participants: Users };

export function Stats() {
  const t = useTranslations("stats");

  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto max-w-container px-6 py-14 lg:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STAT_KEYS.map((key) => {
            const Icon = STAT_ICONS[key];
            return (
              <div key={key} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <Icon size={22} className="mb-3 text-brand-red" />
                <p className="font-display text-3xl text-brand-navy sm:text-4xl">
                  {t(`items.${key}.value`)}
                </p>
                <p className="mt-1 text-sm text-slate">{t(`items.${key}.label`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
