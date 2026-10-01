import { useSearchParams } from 'react-router-dom';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchBrowse } from '../lib/api.js';
import InfiniteView from '../components/feed/InfiniteView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

const TABS = [
  { key: 'trending', label: 'Trending', note: 'Views weighted by recency' },
  { key: 'popular', label: 'Most viewed', note: 'All-time view count' },
  { key: 'new', label: 'Newest', note: 'Latest uploads first' },
];

export default function Trending() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === params.get('tab'))?.key || 'trending';
  const list = useInfiniteList({
    source: `browse-${tab}`,
    deps: [tab],
    fetcher: (cursor, _e, signal) => fetchBrowse({ kind: tab, cursor }, signal),
  });
  const active = TABS.find((t) => t.key === tab);
  const total = list.pages[0]?.meta?.total;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Trending" subtitle={`${active.note}. Ranked list loads automatically as you scroll, 20 at a time from a precomputed index.`} />
      <div className="mb-6 flex items-center gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => setParams({ tab: t.key })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${t.key === tab ? 'bg-fg text-ink' : 'border border-fg/10 bg-fg/[0.04] text-zinc-300 hover:bg-fg/10'}`}
          >
            {t.label}
          </button>
        ))}
        {total && <span className="ml-auto font-mono text-xs text-zinc-500">{total.toLocaleString()} ranked</span>}
      </div>
      <InfiniteView list={list} layout="list" rank />
    </div>
  );
}
