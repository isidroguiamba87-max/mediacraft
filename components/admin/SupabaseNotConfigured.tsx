/** Shown instead of the real panel whenever NEXT_PUBLIC_SUPABASE_URL/
 * NEXT_PUBLIC_SUPABASE_ANON_KEY aren't set yet — lets the navigation,
 * layout and visual design be reviewed before the Supabase project
 * exists, without crashing on a missing env var. */
export function SupabaseNotConfigured() {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="max-w-md rounded-brand border border-line bg-paper p-8 text-center shadow-brand">
        <h1 className="font-display text-xl text-brand-navy">Supabase ainda não está configurado</h1>
        <p className="mt-3 text-sm text-slate">
          Assim que o projecto Supabase existir, adiciona{" "}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          e{" "}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          ao <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">.env.local</code> para
          activar o painel.
        </p>
      </div>
    </div>
  );
}
