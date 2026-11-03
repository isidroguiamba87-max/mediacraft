interface LegalSection {
  title: string;
  body: string;
}

/** Shared layout for /politica-privacidade and /termos-de-uso — both are
 * just a title + intro + numbered sections, structurally identical. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <h1 className="font-display text-4xl text-brand-navy">{title}</h1>
      <p className="mt-2 text-sm text-slate">{updated}</p>
      <p className="mt-6 text-base text-ink">{intro}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section, i) => (
          <section key={i}>
            <h2 className="font-display text-xl text-brand-navy">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
