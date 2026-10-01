import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bell, Check, Eye, Play, Share2, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchBrowse, fetchVideo, signalInterest } from '../lib/api.js';
import { CATEGORY_COLORS } from '../lib/constants.js';
import { formatDuration, formatViews, timeAgo } from '../lib/format.js';
import Thumbnail from '../components/feed/Thumbnail.jsx';
import { Avatar } from '../components/feed/VideoCard.jsx';
import InfiniteView from '../components/feed/InfiniteView.jsx';

export default function Watch() {
  const { id } = useParams();
  const { sessionId } = useApp();
  const [video, setVideo] = useState(null);
  const [missing, setMissing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [subbed, setSubbed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setVideo(null); setMissing(false); setLiked(false);
    fetchVideo(id, ctrl.signal)
      .then((d) => {
        setVideo(d.video);
        document.title = `${d.video.title} · Endless`;
        signalInterest(sessionId, d.video.category, 9000); // opening a video is a strong interest signal
      })
      .catch((e) => { if (e.name !== 'AbortError') setMissing(true); });
    return () => { ctrl.abort(); document.title = 'Endless'; };
  }, [id, sessionId]);

  const related = useInfiniteList({
    source: 'related',
    deps: [id],
    fetcher: (cursor, _e, signal) => fetchBrowse({ kind: 'related', value: id, cursor }, signal),
  });

  if (missing) {
    return <div className="py-24 text-center text-zinc-400">Video not found. <Link to="/" className="text-indigo-400 underline">Back home</Link></div>;
  }

  return (
    <div className="mx-auto grid max-w-[1500px] gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section>
        {video ? (
          <>
            <div className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Thumbnail seed={video.thumbSeed} category={video.category} title={video.title} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transition group-hover:scale-110"><Play className="ml-1 h-7 w-7 fill-current" /></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                <div className="h-1 overflow-hidden rounded-full bg-white/25"><div className="h-full w-1/3 rounded-full bg-rose-500" /></div>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-white/80"><span>0:00</span><span>{formatDuration(video.durationSec)}</span></div>
              </div>
            </div>

            <h1 className="mt-5 text-xl font-bold leading-snug sm:text-2xl">{video.title}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={video.creatorName} size="h-11 w-11" text="text-base" />
                <div>
                  <p className="font-semibold">{video.creatorName}</p>
                  <p className="text-xs text-zinc-500">{formatViews(video.views % 900000 + 12000)} subscribers</p>
                </div>
                <button
                  onClick={() => setSubbed((s) => !s)}
                  className={`ml-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${subbed ? 'bg-fg/10 text-fg' : 'bg-fg text-ink hover:bg-zinc-200'}`}
                >
                  {subbed ? <><Check className="h-4 w-4" /> Subscribed</> : <><Bell className="h-4 w-4" /> Subscribe</>}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setLiked((l) => !l)} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${liked ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200' : 'border-fg/10 bg-fg/5 hover:bg-fg/10'}`}>
                  <ThumbsUp className="h-4 w-4" /> {formatViews(video.likes + (liked ? 1 : 0))}
                </button>
                <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/5 px-4 py-2 text-sm font-medium hover:bg-fg/10">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-fg/[0.04] p-4 text-sm">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
                <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-zinc-400" />{video.views.toLocaleString()} views</span>
                <span className="text-zinc-400">{timeAgo(video.uploadedAt)}</span>
                <Link to={`/category/${video.category}`} className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300 hover:bg-fg/5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[video.category] }} />{video.category}
                </Link>
              </p>
              <p className="mt-3 leading-relaxed text-zinc-400">
                A synthetic {video.category.toLowerCase()} video generated for the Endless demo. Opening it told the recommender you are interested in {video.category}; go back to Home and your feed re-ranks around it.
              </p>
            </div>
          </>
        ) : (
          <div aria-hidden="true">
            <div className="skeleton aspect-video w-full rounded-2xl" />
            <div className="skeleton mt-5 h-7 w-3/4 rounded" />
            <div className="skeleton mt-4 h-11 w-1/2 rounded" />
          </div>
        )}
      </section>

      <aside>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Up next</h2>
        <InfiniteView list={related} layout="compact" />
      </aside>
    </div>
  );
}
