import { useSearchParams } from 'react-router-dom';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchSearch } from '../lib/api.js';
import InfiniteView from '../components/feed/InfiniteView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { formatMs } from '../lib/format.js';
import { formatCompactCount, TOTAL_FALLBACK } from '../lib/constants.js';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const list = useInfiniteList({
    source: 'search',
    deps: [q],
    fetcher: (cursor, _e, signal) => fetchSearch({ q, cursor }, signal),
  });
  const first = list.pages[0]?.meta;
  const datasetSize = first?.total ?? TOTAL_FALLBACK;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={q ? `Results for “${q}”` : 'Search'}
        subtitle={first ? `${first.total.toLocaleString()} matches · first page in ${formatMs(first.latencyMs)} (${first.cacheHit ? 'cache HIT' : `scanned ${formatCompactCount(datasetSize)} titles`})` : q ? 'Searching…' : 'Type something in the search bar.'}
      />
      {q ? <InfiniteView list={list} layout="list" emptyText="No videos matched that search." /> : null}
    </div>
  );
}
