import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchBrowse } from '../lib/api.js';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants.js';
import InfiniteView from '../components/feed/InfiniteView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import NotFound from './NotFound.jsx';

export default function Category() {
  const { name } = useParams();
  const valid = CATEGORIES.includes(name);
  const list = useInfiniteList({
    source: `category-${name}`,
    deps: [name],
    fetcher: (cursor, _e, signal) => fetchBrowse({ kind: 'category', value: name, cursor }, signal),
  });
  if (!valid) return <NotFound />;
  const total = list.pages[0]?.meta?.total;
  return (
    <div>
      <Link to="/explore" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-fg"><ChevronLeft className="h-4 w-4" /> All categories</Link>
      <PageHeader title={name} subtitle="Most viewed first. More videos load as you scroll.">
        <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 px-3 py-1.5 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[name] }} />{total ? `${total.toLocaleString()} videos` : 'loading'}
        </span>
      </PageHeader>
      <InfiniteView list={list} layout="grid" />
    </div>
  );
}
