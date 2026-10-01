const ROWS = [
  ['relevance', 'Relevance', 0.4, 'bg-indigo-400'],
  ['popularity', 'Popularity', 0.25, 'bg-violet-400'],
  ['freshness', 'Freshness', 0.2, 'bg-cyan-400'],
  ['quality', 'Quality', 0.15, 'bg-emerald-400'],
];

export function whyLine(video) {
  if (!video.breakdown) return '';
  const entries = ROWS.map(([k, , w]) => [k, video.breakdown[k] * w]).sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];
  if (top === 'relevance') return `Matches your interest in ${video.category}`;
  if (top === 'popularity') return 'Very popular right now';
  if (top === 'freshness') return 'Recently uploaded';
  return 'High quality pick';
}

export default function ScoreTooltip({ video }) {
  if (!video.breakdown) return null;
  return (
    <div className="pointer-events-none absolute left-2 right-2 top-2 z-20 translate-y-1 rounded-xl border border-fg/10 bg-zinc-950/95 p-3 opacity-0 shadow-2xl backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Ranking score</span>
        <span className="font-mono text-sm font-bold text-fg">{video.score?.toFixed(3)}</span>
      </div>
      <div className="space-y-1.5">
        {ROWS.map(([key, label, weight, color]) => (
          <div key={key} className="flex items-center gap-2 text-[11px] text-zinc-300">
            <span className="w-16 shrink-0">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/10">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, video.breakdown[key] * 100)}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-zinc-500">{Math.round(weight * 100)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-fg/10 pt-2 text-[11px] text-zinc-400">{whyLine(video)}</p>
    </div>
  );
}
