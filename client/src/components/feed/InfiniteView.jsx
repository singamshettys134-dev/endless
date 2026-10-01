import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import VideoCard from './VideoCard.jsx';
import VideoRow from './VideoRow.jsx';
import BatchDivider from './BatchDivider.jsx';
import { CardSkeleton, RowSkeleton } from './Skeletons.jsx';

/**
 * Renders an auto-loading list. layout: 'grid' | 'list' | 'compact'.
 * The sentinel div is what triggers loading, there is no "load more" button anywhere.
 */
export default function InfiniteView({ list, layout = 'grid', dividers = false, rank = false, dwell = false, emptyText = 'Nothing here yet.' }) {
  const { pages, status, sentinelRef, retry, itemCount } = list;
  const grid = 'grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
  const wrap = layout === 'grid' ? grid : layout === 'compact' ? 'flex flex-col gap-1' : 'flex flex-col gap-1';
  const skeletons = layout === 'grid' ? 8 : 5;

  let counter = 0;
  return (
    <div>
      <div className={wrap} aria-live="polite" aria-busy={status === 'loading'}>
        {pages.map((page) => (
          <FragmentPage key={page.n}>
            {dividers && <BatchDivider page={page} />}
            {page.videos.map((video, i) => {
              counter += 1;
              if (layout === 'grid') return <VideoCard key={video.id} video={video} index={i} dwell={dwell} />;
              return <VideoRow key={video.id} video={video} index={i} variant={layout === 'compact' ? 'compact' : 'full'} rank={rank ? counter : undefined} />;
            })}
          </FragmentPage>
        ))}
        {status === 'loading' && Array.from({ length: pages.length ? Math.min(skeletons, 4) : skeletons }, (_, i) =>
          layout === 'grid' ? <CardSkeleton key={`s${i}`} /> : <RowSkeleton key={`s${i}`} compact={layout === 'compact'} />)}
      </div>

      {status !== 'done' && status !== 'error' && <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />}

      {status === 'loading' && pages.length > 0 && (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading more…</p>
      )}
      {status === 'error' && (
        <div className="mx-auto my-10 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
          <p className="text-sm text-zinc-300">Couldn't load more. Retrying automatically when you're back online.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 rounded-full bg-fg/10 px-4 py-2 text-sm font-medium hover:bg-fg/15"><RefreshCw className="h-4 w-4" /> Try now</button>
        </div>
      )}
      {status === 'done' && (
        <p className="py-10 text-center text-sm text-zinc-500">{itemCount ? `You've reached the end · ${itemCount.toLocaleString()} videos` : emptyText}</p>
      )}
    </div>
  );
}

function FragmentPage({ children }) {
  return <>{children}</>;
}
