import { Link, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatMs } from '../../lib/format.js';
import { resolveFetchedLabel, shouldShowLivePill } from '../../lib/livePill.js';

export default function LivePill() {
  const { fetchedCount, total, log } = useApp();
  const { pathname } = useLocation();

  if (!shouldShowLivePill(pathname, fetchedCount)) return null;

  const last = log.at(-1);
  const hit = last?.meta?.cacheHit;

  return (
    <Link
      to="/lab"
      className="fixed bottom-20 right-4 z-30 flex items-center gap-3 rounded-2xl border border-fg/10 bg-zinc-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition hover:border-indigo-400/40 lg:bottom-6 lg:right-6"
      aria-label="Open live lab"
    >
      <Zap className="h-4 w-4 text-indigo-400" />
      <div className="leading-tight">
        <p className="text-sm font-bold text-fg">
          {resolveFetchedLabel(total, fetchedCount)}
        </p>
        <p className="font-mono text-[11px] text-zinc-400">
          <span className={hit ? 'text-emerald-400' : 'text-amber-400'}>{hit ? 'HIT' : 'MISS'}</span> · {formatMs(last?.meta?.latencyMs)}
          {last?.prefetched ? ' · prefetched' : ''}
        </p>
      </div>
    </Link>
  );
}
