import { useState } from 'react';

export default function Sparkline({ points, height = 72 }) {
  const [hover, setHover] = useState(null);
  if (points.length < 2) return <div className="flex h-[72px] items-center justify-center text-xs text-zinc-600">Waiting for requests…</div>;
  const W = 300;
  const max = Math.max(...points.map((p) => p.v), 1);
  const x = (i) => (i / (points.length - 1)) * W;
  const y = (v) => height - 6 - (v / max) * (height - 14);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-[72px] w-full" preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)));
        }}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#818cf8" stopOpacity=".35" />
            <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${W} ${height} L0 ${height} Z`} fill="url(#spark)" />
        <path d={line} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.v)} r={p.hit ? 0 : 2.5} fill="#fbbf24" />)}
        {hover != null && points[hover] && <line x1={x(hover)} x2={x(hover)} y1="0" y2={height} style={{ stroke: "var(--color-fg)" }} strokeOpacity=".3" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-zinc-500">
        <span>last {points.length} requests</span>
        <span>{hover != null && points[hover] ? `${points[hover].v.toFixed(1)} ms · ${points[hover].hit ? 'HIT' : 'MISS'}` : 'amber dots = cache MISS'}</span>
      </div>
    </div>
  );
}
