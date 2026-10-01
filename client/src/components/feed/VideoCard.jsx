import { memo } from 'react';
import { Link } from 'react-router-dom';
import Thumbnail from './Thumbnail.jsx';
import ScoreTooltip from './ScoreTooltip.jsx';
import { CATEGORY_COLORS } from '../../lib/constants.js';
import { formatDuration, formatViews, isNew, timeAgo } from '../../lib/format.js';
import { useDwell } from '../../hooks/useDwell.js';

export function Avatar({ name, size = 'h-9 w-9', text = 'text-sm' }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full font-bold text-white`} style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 50) % 360} 70% 40%))` }}>
      {name[0]}
    </div>
  );
}

function VideoCard({ video, index = 0, dwell = false }) {
  const ref = useDwell(dwell ? video.category : null);
  return (
    <article ref={dwell ? ref : null} className="group relative animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <Link to={`/watch/${video.id}`} className="block rounded-2xl outline-offset-4">
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-fg/5 transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-fg/20 group-hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.55)]">
          <Thumbnail seed={video.thumbSeed} category={video.category} title={video.title} />
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">{formatDuration(video.durationSec)}</span>
          {isNew(video.uploadedAt) && <span className="absolute left-2 top-2 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
          <ScoreTooltip video={video} />
        </div>
        <div className="mt-3 flex gap-3">
          <Avatar name={video.creatorName} />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-50">{video.title}</h3>
            <p className="mt-1 truncate text-[13px] text-zinc-400">{video.creatorName}</p>
            <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
              <span>{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[video.category] }} />
              <span>{video.category}</span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default memo(VideoCard);
