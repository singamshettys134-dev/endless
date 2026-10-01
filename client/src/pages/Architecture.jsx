import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/lab/Panel.jsx';
import { formatCompactCount, TOTAL_FALLBACK } from '../lib/constants.js';

function Box({ x, y, w = 150, h = 54, title, sub, tone = '#6366f1' }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" stroke={tone} strokeOpacity=".7" style={{ fill: "var(--color-raised)" }} />
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" style={{ fill: "var(--color-fg)" }} fontSize="13" fontWeight="700">{title}</text>
      <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" style={{ fill: "var(--color-zinc-400)" }} fontSize="10.5">{sub}</text>
    </g>
  );
}
const Arrow = ({ d, dashed }) => <path d={d} fill="none" stroke="#52525b" strokeWidth="1.6" strokeDasharray={dashed ? '5 4' : undefined} markerEnd="url(#ah)" />;

const FLOW = [
  ['First load', 'Client calls GET /api/feed with a session id and no cursor. Cache miss: the recommender builds ~1,500 ranked candidates once, stores a compact copy (ids + scores, ~36 KB) in the session cache, returns page 1 and a signed cursor.'],
  ['Scroll', 'An IntersectionObserver sentinel sits 1,600 px before the end of the list. Reaching it appends the already-buffered batch instantly, so nothing visibly loads.'],
  ['Prefetch', 'The moment a batch is shown, the client requests the next one in the background using the cursor from the previous response, and holds it in a buffer.'],
  ['Cache hit', 'Every later request for the session skips candidate generation, ranking and re-ranking. It reads the cached list and slices from the cursor offset: sub-millisecond work.'],
  ['Learning', 'Dwelling on a card or opening a video posts an interest signal. The profile changes, the feed version bumps, the next request recomputes the unseen tail (a visible, labelled cache MISS).'],
  ['Failure', 'If the recommender fails, the circuit breaker opens after 5 failures and the feed serves the precomputed trending list, still cursor-paged. It half-opens after 10 s to test recovery.'],
];

const TRADEOFFS = [
  ['Freshness vs. hit rate', 'A longer session TTL means more hits but staler rankings. 15 min TTL; profile changes invalidate immediately.'],
  ['Personalisation vs. latency', 'Full re-ranking per request would be freshest but slow. Rank once per session, page many times.'],
  ['Cursor vs. offset', 'Offsets shift when new items appear (duplicates, skips). The cursor pins a position inside a versioned, cached list.'],
  ['Cache memory', 'Entries hold ids, scores and packed breakdowns (~36 KB), not video objects. 10,000 sessions ≈ 360 MB. Redis is a drop-in for multiple instances.'],
  ['Prefetch cost', 'One extra request is in flight at all times. It is wasted if the user leaves, but it hides 100% of latency for those who keep scrolling.'],
];

export default function Architecture() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Architecture" subtitle="One request path, four mechanisms: cursor pagination, prefetching, a ranking pipeline, and a session cache." />

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          ['Cursor-first', 'Stable position tracking without offset drift.'],
          ['Prefetch-safe', 'The next batch is already buffered when the user nears the end.'],
          ['Cache-aware', 'Session hits skip expensive recomputation and ranking.'],
          ['Observable', 'Every stage is timed and clearly surfaced in the lab.'],
        ].map(([title, body]) => (
          <div key={title} className="soft-card rounded-2xl p-4">
            <p className="text-sm font-semibold text-fg">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
          </div>
        ))}
      </div>

      <Panel title="System diagram">
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 330" className="mx-auto min-w-[760px]" role="img" aria-label="System architecture diagram">
            <defs>
              <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#71717a" /></marker>
            </defs>
            <Box x={10} y={40} title="React client" sub="sentinel · prefetch buffer" tone="#22d3ee" />
            <Box x={210} y={40} title="Express API" sub="/feed · rate limit · cursor" />
            <Box x={410} y={40} title="Feed service" sub="breaker · timing · paging" tone="#a855f7" />
            <Box x={640} y={40} w={170} title="Session cache" sub="LRU, 15 min TTL · Redis opt." tone="#34d399" />
            <Box x={410} y={170} w={150} h={46} title="1 · Candidates" sub="~1,500 from 3 sources" tone="#818cf8" />
            <Box x={410} y={226} w={150} h={46} title="2 · Rank" sub="4-factor score" tone="#818cf8" />
            <Box x={410} y={282} w={150} h={46} title="3 · Re-rank" sub="MMR diversity rules" tone="#818cf8" />
            <Box x={640} y={226} w={170} title="Video store" sub={`${formatCompactCount(TOTAL_FALLBACK)} synthetic videos`} tone="#fbbf24" />
            <Box x={640} y={150} w={170} h={46} title="Trending fallback" sub="when breaker is open" tone="#fb7185" />
            <Arrow d="M160 67 L208 67" />
            <Arrow d="M360 67 L408 67" />
            <Arrow d="M560 60 L638 60" />
            <Arrow d="M638 78 L562 78" dashed />
            <Arrow d="M485 94 L485 168" />
            <Arrow d="M485 216 L485 224" />
            <Arrow d="M485 272 L485 280" />
            <Arrow d="M562 249 L638 249" />
            <Arrow d="M560 190 L638 175" dashed />
            <text x="570" y="52" fill="#71717a" fontSize="10" textAnchor="middle">get / set</text>
            <text x="500" y="135" fill="#71717a" fontSize="10">on MISS only</text>
            <text x="640" y="143" fill="#fb7185" fontSize="10">on failure</text>
          </svg>
        </div>
      </Panel>

      <h2 className="mb-4 mt-10 text-lg font-bold">Request flow</h2>
      <ol className="space-y-3">
        {FLOW.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-panel p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">{i + 1}</span>
            <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-relaxed text-zinc-400">{body}</p></div>
          </li>
        ))}
      </ol>

      <h2 className="mb-4 mt-10 text-lg font-bold">Ranking pipeline</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Candidate generation', '60% from category pools weighted by the session profile, 30% trending, 10% long-tail exploration. Deduplicated to about 1,500.'],
          ['Ranking', 'score = 0.40·relevance + 0.25·popularity + 0.20·freshness + 0.15·quality. Every breakdown is returned, which is what the hover tooltip shows.'],
          ['Re-ranking', 'Maximal Marginal Relevance for diversity, at most 2 in a row from one category, at most 3 per creator, already-seen videos dropped.'],
        ].map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-white/10 bg-panel p-5"><p className="font-semibold">{t}</p><p className="mt-2 text-sm leading-relaxed text-zinc-400">{b}</p></div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold">Cursor design</h2>
      <div className="rounded-2xl border border-white/10 bg-panel p-5 text-sm leading-relaxed text-zinc-400">
        <p>The cursor is an opaque, base64url token holding <span className="font-mono text-zinc-200">sid, offset, feedVersion, lastScore, issuedAt</span>, signed with HMAC-SHA256. Tampered or expired tokens are rejected with HTTP 400.</p>
        <p className="mt-3">Why not offset pagination: with <span className="font-mono text-zinc-200">?page=3</span> the server has no memory of what the client already saw. When the ranking changes between requests, items shift, so users see duplicates or miss videos. A cursor pins the exact position inside a specific, versioned list, and resuming is O(1).</p>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold">Trade-offs</h2>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {TRADEOFFS.map(([k, v], i) => (
          <div key={k} className={`grid gap-1 p-4 sm:grid-cols-[220px_1fr] sm:gap-6 ${i ? 'border-t border-white/10' : ''}`}>
            <p className="text-sm font-semibold">{k}</p>
            <p className="text-sm text-zinc-400">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold">Scaling out</h2>
      <div className="rounded-2xl border border-white/10 bg-panel p-5 text-sm leading-relaxed text-zinc-400">
        The API is stateless apart from the cache. Set <span className="font-mono text-zinc-200">REDIS_URL</span> and every instance shares session state, so any instance can serve any cursor. The same cache entry makes recovery trivial: if it expires mid-scroll, the signed cursor still carries the offset, and the list is rebuilt deterministically.
      </div>
    </div>
  );
}
