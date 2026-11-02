import { useTranslations } from "next-intl";
import { SectionHead } from "@/components/ui/SectionHead";
import { TeamDeck } from "./TeamDeck";

export function Team() {
  const t = useTranslations("team");

  return (
    <section className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <SectionHead title={t("title")} align="center" className="mx-auto" />

      <TeamDeck />
    </section>
  );
}
