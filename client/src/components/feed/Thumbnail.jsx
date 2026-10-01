import { memo, useMemo } from 'react';
import { Gamepad2, Music, Cpu, Trophy, ChefHat, Plane, GraduationCap, Laugh, Newspaper, Dumbbell, Clapperboard, FlaskConical } from 'lucide-react';
import { CATEGORY_COLORS } from '../../lib/constants.js';

export const ICONS = { Gaming: Gamepad2, Music, Tech: Cpu, Cricket: Trophy, Cooking: ChefHat, Travel: Plane, Education: GraduationCap, Comedy: Laugh, News: Newspaper, Fitness: Dumbbell, Movies: Clapperboard, Science: FlaskConical };

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Deterministic SVG thumbnail: no image files, no network. */
function Thumbnail({ seed, category, title, className = '' }) {
  const art = useMemo(() => {
    const r = rng(seed);
    const base = CATEGORY_COLORS[category] || '#6366f1';
    const a = shade(base, -70 + r() * 30);
    const b = shade(base, 20 + r() * 60);
    const angle = Math.floor(r() * 360);
    const shapes = Array.from({ length: 4 + Math.floor(r() * 3) }, () => ({
      cx: r() * 320, cy: r() * 180, r: 24 + r() * 90, o: 0.08 + r() * 0.22, light: r() > 0.5,
    }));
    const kind = Math.floor(r() * 3);
    const words = title.split(' ');
    return { a, b, angle, shapes, kind, line1: words.slice(0, 2).join(' '), line2: words.slice(2, 4).join(' '), flip: r() > 0.5 };
  }, [seed, category, title]);

  const Icon = ICONS[category] || Cpu;
  const gid = `g${seed}`;
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-zinc-900 ${className}`}>
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gid} gradientTransform={`rotate(${art.angle} .5 .5)`}>
            <stop offset="0" stopColor={art.a} />
            <stop offset="1" stopColor={art.b} />
          </linearGradient>
          <radialGradient id="vig" cx=".5" cy=".5" r=".75">
            <stop offset=".6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".35" />
          </radialGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#${gid})`} />
        {art.kind === 0 && Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={-40 + i * 50} y1="180" x2={40 + i * 50} y2="0" stroke="#fff" strokeOpacity="0.07" strokeWidth="14" />
        ))}
        {art.kind === 1 && Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx="260" cy="40" r={20 + i * 26} fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="2" />
        ))}
        {art.kind === 2 && Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={10 + i * 27} y={150 - ((i * 37) % 90)} width="16" height={20 + ((i * 37) % 90)} rx="3" fill="#fff" fillOpacity="0.07" />
        ))}
        {art.shapes.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.light ? '#fff' : '#000'} fillOpacity={s.o} />)}
        <rect width="320" height="180" fill="url(#vig)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
      <Icon className={`absolute top-3 ${art.flip ? 'left-3' : 'right-3'} h-6 w-6 text-white/55`} strokeWidth={1.6} />
      <div className={`absolute bottom-3 left-3 right-16 font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] `}>
        <div className="text-[clamp(14px,2.2vw,22px)]">{art.line1}</div>
        {art.line2 && <div className="text-[clamp(11px,1.5vw,15px)] text-white/80">{art.line2}</div>}
      </div>
    </div>
  );
}

export default memo(Thumbnail);
