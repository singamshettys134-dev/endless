import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchFeed } from '../lib/api.js';
import { CATEGORIES, CATEGORY_COLORS, formatCompactCount, TOTAL_FALLBACK } from '../lib/constants.js';
import InfiniteView from '../components/feed/InfiniteView.jsx';
import { ArrowRight, Radio } from 'lucide-react';

export default function Home() {
  const { sessionId, settingsRef, profile } = useApp();
  const list = useInfiniteList({
    source: 'home',
    track: true,
    loop: true,
    deps: [sessionId],
    fetcher: (cursor, epoch, signal) =>
      fetchFeed({ session: epoch ? `${sessionId}~${epoch}` : sessionId, cursor, ...settingsRef.current }, signal),
  });

  const top = profile ? Object.entries(profile)[0] : null;

  return (
    <div>
      <section className="showcase-intro mb-8" aria-labelledby="feed-title">
        <div className="showcase-copy">
          <div className="showcase-kicker"><Radio className="h-3.5 w-3.5" /> Live recommendation system</div>
          <h1 id="feed-title">A feed that feels infinite.<br /><span>A system that stays intentional.</span></h1>
          <p>Personalized ranking, session-aware cursors, and background prefetching working together in one continuous stream.</p>
          <div className="showcase-actions">
            <Link to="/architecture" className="showcase-link showcase-link-primary">Explore the architecture <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/lab" className="showcase-link">Open live lab</Link>
          </div>
        </div>
        <div className="showcase-stats" aria-label="System defaults">
          <div><span>Catalog</span><strong>{formatCompactCount(TOTAL_FALLBACK)}</strong><small>synthetic items</small></div>
          <div><span>Pagination</span><strong>Cursor</strong><small>session-stable</small></div>
          <div><span>Cache</span><strong>15 min</strong><small>sliding session TTL</small></div>
        </div>
      </section>

      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        <span className="shrink-0 rounded-full bg-fg px-4 py-1.5 text-sm font-semibold text-ink">For you</span>
        {CATEGORIES.map((c) => (
          <Link key={c} to={`/category/${c}`} className="flex shrink-0 items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.04] px-4 py-1.5 text-sm text-zinc-300 transition hover:bg-fg/10">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[c] }} />{c}
          </Link>
        ))}
      </div>

      {top && list.itemCount > 40 && (
        <p className="mb-6 text-xs text-zinc-500">
          Personalised for this session · leaning <span className="font-semibold text-zinc-300">{top[0]}</span>. Hover a card to see why it was ranked.
        </p>
      )}

      <InfiniteView list={list} layout="grid" dividers dwell />
    </div>
  );
}
