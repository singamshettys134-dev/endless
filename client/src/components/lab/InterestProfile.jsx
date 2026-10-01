import { CATEGORY_COLORS } from '../../lib/constants.js';

export default function InterestProfile({ profile }) {
  if (!profile) return <p className="text-xs text-zinc-600">Opens with a flat profile. Watch videos or dwell on cards and it shifts.</p>;
  const entries = Object.entries(profile);
  const max = Math.max(...entries.map(([, v]) => v), 0.0001);
  return (
    <ul className="space-y-1.5">
      {entries.map(([name, v], i) => (
        <li key={name} className="flex items-center gap-3 text-xs">
          <span className={`w-20 shrink-0 ${i === 0 ? 'font-semibold text-fg' : 'text-zinc-400'}`}>{name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-fg/5">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v / max) * 100}%`, background: CATEGORY_COLORS[name] }} />
          </div>
          <span className="w-10 text-right font-mono text-zinc-500">{(v * 100).toFixed(0)}%</span>
        </li>
      ))}
    </ul>
  );
}
