import { useState } from 'react';
import { Play, Trophy } from 'lucide-react';
import { fetchFeed } from '../../lib/api.js';
import Panel from './Panel.jsx';

const BATCHES = 8;
const READ_MS = 600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MODES = [
  { key: 'a', name: 'Cache OFF · Prefetch OFF', cache: false, prefetch: false },
  { key: 'b', name: 'Cache ON · Prefetch ON', cache: true, prefetch: true },
];

/**
 * Two simulated users scroll 8 batches against the real API. "Wait" is the time the user actually
 * stood still at the bottom of the page. Prefetch overlaps the request with reading time.
 * RTT is a simulated client-side network delay so the result looks like a real connection.
 */
async function runMode(mode, rtt, onStep) {
  const sid = `race-${mode.key}-${Date.now()}`;
  let cursor = null;
  const call = async () => {
    const [res] = await Promise.all([fetchFeed({ session: sid, cursor, cache: mode.cache, limit: 20 }), sleep(rtt)]);
    cursor = res.nextCursor;
    return res;
  };
  let pending = null;
  let total = 0;
  for (let i = 0; i < BATCHES; i += 1) {
    if (!mode.prefetch || i === 0) pending = call();
    const t = performance.now();
    await pending;
    const wait = performance.now() - t;
    total += wait;
    onStep({ i, wait, total });
    if (mode.prefetch && i < BATCHES - 1) pending = call(); // started while the user reads
    await sleep(READ_MS);
  }
  return total;
}

export default function Race() {
  const [rtt, setRtt] = useState(120);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState({ a: { steps: [], total: 0 }, b: { steps: [], total: 0 } });
  const [finished, setFinished] = useState(false);

  const start = async () => {
    setRunning(true);
    setFinished(false);
    setState({ a: { steps: [], total: 0 }, b: { steps: [], total: 0 } });
    const upd = (key) => (s) => setState((prev) => ({ ...prev, [key]: { steps: [...prev[key].steps, s.wait], total: s.total } }));
    await Promise.all(MODES.map((m) => runMode(m, rtt, upd(m.key))));
    setRunning(false);
    setFinished(true);
  };

  const max = Math.max(state.a.total, state.b.total, 1);
  const speedup = state.b.total ? state.a.total / state.b.total : 0;
  return (
    <Panel
      title="A/B race"
      hint={`Two simulated users scroll ${BATCHES} batches against the live API. Wait = time spent staring at a loading state.`}
      right={
        <button onClick={start} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-ink transition hover:bg-zinc-200 disabled:opacity-50">
          <Play className="h-4 w-4 fill-current" /> {running ? 'Running…' : 'Run race'}
        </button>
      }
    >
      <label className="mb-5 flex items-center gap-3 text-xs text-zinc-400">
        Simulated network RTT
        <input type="range" min="0" max="400" step="20" value={rtt} onChange={(e) => setRtt(+e.target.value)} disabled={running} className="w-40 accent-indigo-500" />
        <span className="font-mono text-zinc-200">{rtt} ms</span>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m) => {
          const s = state[m.key];
          const winner = finished && s.total === Math.min(state.a.total, state.b.total);
          return (
            <div key={m.key} className={`rounded-xl border p-4 ${winner ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-fg/10 bg-fg/[0.02]'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{m.name}</p>
                {winner && <Trophy className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">{Math.round(s.total)}<span className="ml-1 text-base font-normal text-zinc-500">ms waited</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-fg/5"><div className={`h-full rounded-full transition-all duration-500 ${winner ? 'bg-emerald-400' : 'bg-indigo-400'}`} style={{ width: `${(s.total / max) * 100}%` }} /></div>
              <div className="mt-4 flex h-10 items-end gap-1" aria-hidden="true">
                {Array.from({ length: BATCHES }, (_, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-fg/10" style={{ height: s.steps[i] != null ? `${Math.max(6, Math.min(100, (s.steps[i] / (rtt + 150)) * 100))}%` : '6%', background: s.steps[i] != null ? (s.steps[i] < 5 ? '#34d399' : '#818cf8') : undefined }} />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">bars = wait per batch · green = zero wait</p>
            </div>
          );
        })}
      </div>
      {finished && speedup > 0 && (
        <p className="mt-4 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Cache + prefetch cut total waiting by <span className="font-bold">{speedup >= 100 ? '100×+' : `${speedup.toFixed(1)}×`}</span> ({Math.round(state.a.total)} ms → {Math.round(state.b.total)} ms). The only batch the user ever waits for is the first.
        </p>
      )}
    </Panel>
  );
}
