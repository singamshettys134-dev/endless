const STAGES = [
  ['cacheRead', 'Cache read', 'bg-emerald-400'],
  ['candidates', 'Candidates', 'bg-indigo-400'],
  ['rank', 'Rank', 'bg-violet-400'],
  ['rerank', 'Re-rank (MMR)', 'bg-fuchsia-400'],
  ['serialize', 'Page + serialize', 'bg-cyan-400'],
];

export default function StageBar({ stageMs }) {
  const total = STAGES.reduce((s, [k]) => s + (stageMs?.[k] || 0), 0);
  if (!total) return <p className="text-xs text-zinc-600">No timings yet.</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-fg/5">
        {STAGES.map(([k, , color]) => {
          const v = stageMs[k] || 0;
          return v > 0 ? <div key={k} className={`${color} transition-all duration-500`} style={{ width: `${(v / total) * 100}%` }} title={`${v} ms`} /> : null;
        })}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {STAGES.map(([k, label, color]) => (
          <li key={k} className="flex items-center justify-between gap-2 text-zinc-400">
            <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
            <span className="font-mono text-zinc-200">{(stageMs[k] || 0).toFixed(1)} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
