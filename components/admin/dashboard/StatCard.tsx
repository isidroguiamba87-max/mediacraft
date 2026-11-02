export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption?: string;
}) {
  return (
    <div className="rounded-brand border border-line bg-paper p-5">
      <p className="text-xs font-semibold tracking-wide text-slate uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl text-brand-navy">{value}</p>
      {caption && <p className="mt-1 text-xs text-slate">{caption}</p>}
    </div>
  );
}
