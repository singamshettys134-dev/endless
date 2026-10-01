import { useApp } from '../../context/AppContext.jsx';

const ITEMS = [
  { key: 'cache', label: 'Session cache', on: 'Ranked list reused for the whole session', off: 'Recomputed on every request' },
  { key: 'prefetch', label: 'Prefetch', on: 'Next batch loads before you reach it', off: 'Loads only at the very bottom' },
  { key: 'slow', label: 'Slow recommender', on: 'Adds 180–460 ms to each request', off: 'Normal speed' },
  { key: 'fail', label: 'Recommender failure', on: 'Breaker trips, trending fallback serves', off: 'Healthy' },
];

export function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Toggles() {
  const { settings, setSetting } = useApp();
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map((it) => (
        <div key={it.key} className="flex items-center justify-between gap-4 rounded-xl border border-fg/10 bg-fg/[0.03] p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{it.label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{settings[it.key] ? it.on : it.off}</p>
          </div>
          <Switch checked={settings[it.key]} onChange={(v) => setSetting(it.key, v)} label={it.label} />
        </div>
      ))}
    </div>
  );
}
