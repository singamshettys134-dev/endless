import express from 'express';
import { performance } from 'node:perf_hooks';
import { decodeCursor, buildNextCursor } from '../cursor.js';
import { getDataStore } from '../data/index.js';
import { sessionCache } from '../cache/sessionCache.js';
import { getMetricSnapshot, recordMetric } from '../metrics.js';
import { generateCandidates } from '../recommender/candidates.js';
import { rankCandidates } from '../recommender/ranker.js';
import { rerankWithMmr } from '../recommender/reranker.js';
import { bumpSessionVersion, getSessionProfile, getSessionVersion, updateSessionProfile } from '../recommender/profile.js';
import { circuitBreaker, applyRequestFaults } from '../resilience.js';
import { publicVideo } from '../serialize.js';

const router = express.Router();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (n) => Math.round(n * 1000) / 1000;

function sortProfile(profile) {
  return Object.fromEntries([...Object.entries(profile || {})].sort((a, b) => b[1] - a[1]));
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Degraded path: precomputed trending list, still cursor-paged. */
function trendingFallback({ store, sessionId, offset, limit, feedVersion, profile, t0, reason }) {
  const slice = store.trending.slice(offset, offset + limit).map((v) => publicVideo(v, { score: 0, breakdown: { relevance: 0, popularity: 0, freshness: 0, quality: 0 } }));
  const nextOffset = offset + slice.length;
  const latencyMs = round(performance.now() - t0);
  const meta = {
    cacheHit: false, reason, latencyMs, stageMs: { candidates: 0, rank: 0, rerank: 0, cacheRead: 0, serialize: 0 },
    batch: limit, fetched: slice.length, total: store.total, degraded: true, feedVersion, profile: sortProfile(profile),
    breaker: circuitBreaker.getState(),
  };
  recordMetric({ latencyMs, cacheHit: false, degraded: true, stageMs: meta.stageMs });
  return {
    videos: slice,
    nextCursor: nextOffset < store.trending.length ? buildNextCursor({ sid: sessionId, offset: nextOffset, feedVersion, lastScore: 0 }) : null,
    meta,
  };
}

export async function getFeedData({ sessionId, cursorToken, limit = 20, cacheMode = 'on', simulateSlow = 0, simulateFail = 0 }) {
  const t0 = performance.now();
  const store = getDataStore();
  const faults = applyRequestFaults({ simulateSlow, simulateFail });
  const profile = getSessionProfile(sessionId);
  const feedVersion = getSessionVersion(sessionId) || 1;
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  let offset = 0;
  let cursorVersion = null;
  if (cursorToken) {
    const decoded = decodeCursor(cursorToken);
    if (!decoded.valid) throw httpError(400, `invalid_cursor:${decoded.reason}`);
    offset = Number(decoded.payload.offset || 0);
    cursorVersion = Number(decoded.payload.feedVersion) || null;
  }
  // The cursor was issued for an older ranking than the session has now (a signal bumped feedVersion).
  const staleCursor = cursorVersion !== null && cursorVersion !== feedVersion;

  if (faults.fail) circuitBreaker.recordFailure();
  if (faults.fail || !circuitBreaker.canExecute()) {
    return trendingFallback({ store, sessionId, offset, limit: safeLimit, feedVersion, profile, t0, reason: faults.fail ? 'simulated-failure' : 'breaker-open' });
  }
  if (faults.slow) await sleep(180 + Math.random() * 280);

  const stageMs = { candidates: 0, rank: 0, rerank: 0, cacheRead: 0, serialize: 0 };
  const key = `session:${sessionId}`;

  let feed = null;
  let prior = null;
  let reason = 'cache-hit';
  if (cacheMode !== 'off') {
    const c0 = performance.now();
    const cached = await sessionCache.get(key);
    stageMs.cacheRead = round(performance.now() - c0);
    if (cached && cached.feedVersion === feedVersion) feed = cached;
    else {
      prior = cached || null;
      reason = cached ? 'profile-changed' : 'cold-start';
    }
  } else {
    reason = 'cache-bypassed';
  }

  // Rebase a stale cursor so a re-rank never repeats what the user already saw.
  //  - snapshot for the cursor's version still cached -> rebuild the feed excluding everything served so far
  //    (earlier exclusions + prior.ids[0..offset)), and continue from the top of the new ranking.
  //  - new snapshot already built by a parallel request, or old one evicted -> restart at the top of the
  //    new ranking (best effort; the client de-dupes by id).
  let excluded = [];
  if (staleCursor) {
    if (!feed && prior && prior.feedVersion === cursorVersion) {
      excluded = [...(prior.excluded || []), ...Array.prototype.slice.call(prior.ids, 0, Math.min(offset, prior.ids.length))];
    }
    offset = 0;
  }

  const cacheHit = Boolean(feed);
  if (!feed) {
    let s = performance.now();
    const candidateIds = generateCandidates({ sessionId, feedVersion, profile, limit: 1500 });
    stageMs.candidates = round(performance.now() - s);
    s = performance.now();
    const ranked = rankCandidates({ candidateIds, profile });
    stageMs.rank = round(performance.now() - s);
    s = performance.now();
    const reranked = rerankWithMmr(ranked, excluded);
    stageMs.rerank = round(performance.now() - s);
    // Compact cache entry: ids + scores + packed breakdowns (~36 KB/session), hydrated from the store on read.
    const n = reranked.length;
    const ids = new Int32Array(n);
    const scores = new Float32Array(n);
    const bd = new Float32Array(n * 4);
    reranked.forEach((item, i) => {
      ids[i] = item.id;
      scores[i] = item.score;
      bd[i * 4] = item.breakdown.relevance;
      bd[i * 4 + 1] = item.breakdown.popularity;
      bd[i * 4 + 2] = item.breakdown.freshness;
      bd[i * 4 + 3] = item.breakdown.quality;
    });
    feed = { ids, scores, bd, feedVersion, excluded };
    if (cacheMode !== 'off') await sessionCache.set(key, feed);
  }

  const s2 = performance.now();
  const poolSize = feed.ids.length;
  const end = Math.min(poolSize, offset + safeLimit);
  const sliced = [];
  for (let i = offset; i < end; i += 1) {
    sliced.push(publicVideo(store.getById(feed.ids[i]), {
      score: Math.round(feed.scores[i] * 1000) / 1000,
      breakdown: {
        relevance: round(feed.bd[i * 4]), popularity: round(feed.bd[i * 4 + 1]),
        freshness: round(feed.bd[i * 4 + 2]), quality: round(feed.bd[i * 4 + 3]),
      },
    }));
  }
  const nextOffset = offset + sliced.length;
  const nextCursor = nextOffset < poolSize
    ? buildNextCursor({ sid: sessionId, offset: nextOffset, feedVersion, lastScore: sliced.at(-1)?.score ?? 0 })
    : null;
  stageMs.serialize = round(performance.now() - s2);

  circuitBreaker.recordSuccess();
  const latencyMs = round(performance.now() - t0);
  const meta = {
    cacheHit, reason, latencyMs, stageMs, batch: safeLimit, fetched: sliced.length, total: store.total,
    poolSize, offset, rebased: staleCursor, degraded: false, feedVersion, profile: sortProfile(profile),
    breaker: circuitBreaker.getState(),
  };
  recordMetric({ latencyMs, cacheHit, degraded: false, stageMs });
  return { videos: sliced, nextCursor, meta };
}

router.get('/feed', async (req, res, next) => {
  try {
    const sessionId = String(req.query.session || `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
    const result = await getFeedData({
      sessionId,
      cursorToken: req.query.cursor || null,
      limit: Number(req.query.limit || 20),
      cacheMode: req.query.cache === 'off' ? 'off' : 'on',
      simulateSlow: Number(req.query.simulateSlow || 0),
      simulateFail: Number(req.query.simulateFail || 0),
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/feed/signal', (req, res) => {
  const { session, category, dwellMs = 0 } = req.body || {};
  if (session && category) {
    updateSessionProfile(session, { category, dwellMs });
    bumpSessionVersion(session);
  }
  res.status(204).end();
});

router.get('/metrics', (_req, res) => {
  const snapshot = getMetricSnapshot();
  res.json({
    requests: snapshot.totalRequests,
    p50: snapshot.p50,
    p95: snapshot.p95,
    p99: snapshot.p99,
    cacheHitRate: snapshot.cacheHitRate,
    breakerState: circuitBreaker.getState(),
    uptime: snapshot.uptimeMs,
    cache: sessionCache.stats(),
  });
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, totalVideos: getDataStore().total });
});

export default router;
