export default function Panel({ title, hint, right, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-fg/10 bg-panel p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
          {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = 'text-fg' }) {
  return (
    <div>
      <p className={`text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  );
}
