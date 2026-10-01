import { memo } from 'react';
import { Link } from 'react-router-dom';
import Thumbnail from './Thumbnail.jsx';
import { Avatar } from './VideoCard.jsx';
import { CATEGORY_COLORS } from '../../lib/constants.js';
import { formatDuration, formatViews, timeAgo } from '../../lib/format.js';

/** Horizontal list row (Internshala/Trending style). variant="compact" is the watch-page sidebar. */
function VideoRow({ video, rank, variant = 'full', index = 0 }) {
  const compact = variant === 'compact';
  return (
    <Link
      to={`/watch/${video.id}`}
      className={`group flex animate-fade-up gap-4 rounded-2xl border border-transparent transition hover:border-fg/10 hover:bg-fg/[0.03] ${compact ? 'p-1.5' : 'p-3'}`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      {rank != null && (
        <div className="hidden w-10 shrink-0 items-center justify-center text-2xl font-black text-zinc-600 transition group-hover:text-indigo-400 sm:flex">{rank}</div>
      )}
      <div className={`relative shrink-0 overflow-hidden rounded-xl ${compact ? 'w-40' : 'w-44 sm:w-64'}`}>
        <Thumbnail seed={video.thumbSeed} category={video.category} title={video.title} />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-semibold text-white">{formatDuration(video.durationSec)}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className={`line-clamp-2 font-semibold leading-snug text-zinc-50 ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>{video.title}</h3>
        <p className="mt-1 text-[13px] text-zinc-400">{video.creatorName}</p>
        <p className="text-[13px] text-zinc-500">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</p>
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 px-2.5 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[video.category] }} />{video.category}
            </span>
            <span className="rounded-full bg-fg/5 px-2.5 py-1 text-xs text-zinc-400">{formatViews(video.likes)} likes</span>
          </div>
        )}
      </div>
      {!compact && <Avatar name={video.creatorName} size="hidden h-10 w-10 sm:flex" />}
    </Link>
  );
}

export default memo(VideoRow);
