import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchFeed } from '../lib/api.js';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants.js';
import InfiniteView from '../components/feed/InfiniteView.jsx';

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
