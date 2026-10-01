import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { fetchMetrics } from '../lib/api.js';
import { formatMs, percent } from '../lib/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel, { Stat } from '../components/lab/Panel.jsx';
import Toggles from '../components/lab/Toggles.jsx';
import Heatmap from '../components/lab/Heatmap.jsx';
import Sparkline from '../components/lab/Sparkline.jsx';
import StageBar from '../components/lab/StageBar.jsx';
import InterestProfile from '../components/lab/InterestProfile.jsx';
import CursorViewer from '../components/lab/CursorViewer.jsx';
import Race from '../components/lab/Race.jsx';

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export default function Lab() {
  const { log, fetchedCount, total, profile, lastCursor, prefetchState } = useApp();
  const [server, setServer] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = () => fetchMetrics().then((d) => alive && setServer(d)).catch(() => undefined);
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const home = useMemo(() => log.filter((e) => e.source === 'home'), [log]);
  const last = home.at(-1);
  const hits = home.filter((e) => e.meta?.cacheHit);
  const misses = home.filter((e) => !e.meta?.cacheHit && !e.meta?.degraded);
  const lastMiss = [...home].reverse().find((e) => e.meta?.stageMs && (e.meta.stageMs.candidates || 0) > 0);
  const prefetched = home.filter((e) => e.prefetched);
  const hidden = prefetched.reduce((s, e) => s + (e.meta?.latencyMs || 0), 0);
  const points = home.slice(-30).map((e) => ({ v: e.meta?.latencyMs || 0, hit: e.meta?.cacheHit }));
  const avgHit = avg(hits.map((e) => e.meta.latencyMs));
  const avgMiss = avg(misses.map((e) => e.meta.latencyMs));
  const breaker = last?.meta?.breaker || server?.breakerState || 'closed';
  const pf = { idle: ['Idle', 'text-zinc-400'], prefetching: ['Prefetching next batch…', 'text-violet-300'], ready: ['Next batch ready in buffer', 'text-emerald-300'] }[prefetchState];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Live Lab" subtitle="Real numbers from the real API, updated as you scroll. Open Home, scroll for a few seconds, then come back." />

      <Toggles />

      {!home.length && (
        <div className="mt-6 rounded-2xl border border-dashed border-fg/15 p-8 text-center text-sm text-zinc-400">
          No traffic yet. <Link to="/" className="font-semibold text-indigo-300 underline">Open Home</Link> and scroll, or hit <span className="font-semibold text-zinc-200">Run race</span> below.
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel title="Dataset vs. fetched" className="lg:col-span-2" hint="Each cell is one video. Glowing cells are the only ones this session ever downloaded.">
          <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-2">
            <Stat label="fetched" value={fetchedCount.toLocaleString()} tone="text-indigo-300" />
            <Stat label="in dataset" value={total.toLocaleString()} />
            <Stat label="of dataset" value={`${percent(fetchedCount, total).toFixed(2)}%`} tone="text-emerald-300" />
          </div>
          <Heatmap />
        </Panel>

        <div className="grid gap-5">
          <Panel title="Session cache" right={<Zap className="h-4 w-4 text-zinc-600" />}>
            <div className="flex items-center gap-3">
              <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${last?.meta?.cacheHit ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}>{last ? (last.meta.cacheHit ? 'HIT' : 'MISS') : '—'}</span>
              <span className="text-xs text-zinc-500">{last?.meta?.reason?.replace(/-/g, ' ') || 'waiting'}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="avg HIT" value={formatMs(avgHit)} tone="text-emerald-300" />
              <Stat label="avg MISS" value={formatMs(avgMiss)} tone="text-amber-300" />
            </div>
            {avgHit != null && avgMiss != null && avgHit > 0 && <p className="mt-3 text-xs text-zinc-500">A hit is <span className="font-semibold text-zinc-200">{(avgMiss / avgHit).toFixed(0)}×</span> faster than recomputing.</p>}
            {server && <p className="mt-3 border-t border-fg/5 pt-3 font-mono text-[11px] text-zinc-500">server: {server.cache.entries} sessions cached · {server.cacheHitRate.toFixed(0)}% hit rate</p>}
          </Panel>

          <Panel title="Prefetch" right={<Activity className="h-4 w-4 text-zinc-600" />}>
            <p className={`text-sm font-semibold ${pf[1]}`}>{pf[0]}</p>
            <p className="mt-3 text-xs text-zinc-500">{prefetched.length} of {home.length} batches arrived prefetched</p>
            <p className="mt-1 text-xs text-zinc-500">≈ <span className="font-semibold text-zinc-200">{Math.round(hidden)} ms</span> of server time hidden from the user (plus the network round trip)</p>
          </Panel>
        </div>

        <Panel title="Latency" hint="Per-request, from the server's own timer" className="lg:col-span-2">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="last" value={formatMs(last?.meta?.latencyMs)} />
            <Stat label="p50" value={server ? formatMs(server.p50) : '–'} />
            <Stat label="p95" value={server ? formatMs(server.p95) : '–'} />
            <Stat label="p99" value={server ? formatMs(server.p99) : '–'} />
          </div>
          <Sparkline points={points} />
        </Panel>

        <Panel title="Circuit breaker" right={<ShieldCheck className="h-4 w-4 text-zinc-600" />}>
          <p className={`text-lg font-bold capitalize ${breaker === 'closed' ? 'text-emerald-300' : breaker === 'open' ? 'text-rose-300' : 'text-amber-300'}`}>{breaker}</p>
          <p className="mt-2 text-xs text-zinc-500">{last?.meta?.degraded ? 'Serving the precomputed trending fallback.' : 'Recommender healthy. Flip “Recommender failure” above to watch the fallback take over.'}</p>
        </Panel>

        <Panel title="Where the time goes" hint={lastMiss ? 'Most recent cache MISS, broken down by stage' : 'Shown after the first cache MISS'} className="lg:col-span-2">
          <StageBar stageMs={lastMiss?.meta?.stageMs} />
        </Panel>

        <Panel title="Current cursor" hint="Opaque, signed, tamper-proof">
          <CursorViewer token={lastCursor} />
        </Panel>

        <Panel title="Interest profile" hint="Learned live from dwell time and clicks" className="lg:col-span-3">
          <InterestProfile profile={profile} />
        </Panel>
      </div>

      <div className="mt-5"><Race /></div>
    </div>
  );
}
