import { formatMs } from '../../lib/format.js';
import { formatCompactCount, TOTAL_FALLBACK } from '../../lib/constants.js';

const REASON = {
  'cache-hit': 'cache HIT',
  'cold-start': 'cache MISS · cold start',
  'profile-changed': 'cache MISS · profile changed',
  'cache-bypassed': 'cache OFF',
  'precomputed-index': 'indexed',
  'scan-100k': `scanned ${formatCompactCount(TOTAL_FALLBACK)}`,
  'simulated-failure': 'fallback · trending',
  'breaker-open': 'fallback · breaker open',
};

export default function BatchDivider({ page }) {
  const m = page.meta || {};
  const hit = m.cacheHit;
  const dot = m.degraded ? 'bg-rose-400' : hit ? 'bg-emerald-400' : 'bg-amber-400';
  return (
    <div className="col-span-full my-2 flex items-center gap-3 text-[11px] text-zinc-500" role="separator">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-fg/10" />
      <div className="flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-1 font-mono">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span>batch {page.n}</span>
        <span className="text-zinc-700">·</span>
        <span>{REASON[m.reason] || (hit ? 'cache HIT' : 'cache MISS')}</span>
        <span className="text-zinc-700">·</span>
        <span>{formatMs(m.latencyMs)}</span>
        {page.prefetched && <><span className="text-zinc-700">·</span><span className="text-violet-300">prefetched</span></>}
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-fg/10" />
    </div>
  );
}
