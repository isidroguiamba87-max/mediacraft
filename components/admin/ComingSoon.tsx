/** Placeholder for a module not yet built (Fases 3-8 do plano) — keeps
 * the navigation fully clicável desde já, sem fingir que o conteúdo já
 * existe. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl text-brand-navy">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate">{description}</p>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-brand border border-dashed border-line bg-paper px-6 py-16 text-center">
        <p className="text-sm text-slate">Este módulo ainda não foi construído.</p>
      </div>
    </div>
  );
}
