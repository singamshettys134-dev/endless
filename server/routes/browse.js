import express from 'express';
import { performance } from 'node:perf_hooks';
import { categories, categoryColors } from '../config.js';
import { decodeCursor, buildNextCursor } from '../cursor.js';
import { getDataStore } from '../data/index.js';
import { sessionCache } from '../cache/sessionCache.js';
import { publicVideo } from '../serialize.js';

const router = express.Router();
const round = (n) => Math.round(n * 100) / 100;
const memo = new Map();

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Precomputed, memoized sorted lists: O(1) page slices afterwards. */
function listFor(kind, value) {
  const store = getDataStore();
  const key = `${kind}:${value || ''}`;
  if (memo.has(key)) return memo.get(key);
  let list = [];
  if (kind === 'trending') list = store.trending;
  else if (kind === 'popular') list = store.popularity;
  else if (kind === 'new') list = [...store.videos].sort((a, b) => b.uploadedAt - a.uploadedAt);
  else if (kind === 'category') list = [...(store.byCategory.get(value) || [])].sort((a, b) => b.views - a.views);
  memo.set(key, list);
  return list;
}

function paginate({ sid, list, cursor, limit, pick }) {
  let offset = 0;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded.valid || decoded.payload.sid !== sid) throw httpError(400, 'invalid_cursor');
    offset = Number(decoded.payload.offset || 0);
  }
  const slice = pick ? pick(offset, limit) : list.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const cap = list.length;
  const nextCursor = slice.length && nextOffset < cap
    ? buildNextCursor({ sid, offset: nextOffset, feedVersion: 1, lastScore: 0 })
    : null;
  return { slice, nextCursor, offset };
}

const clampLimit = (v) => Math.min(50, Math.max(1, Number(v) || 20));

router.get('/categories', (_req, res) => {
  const store = getDataStore();
  res.json({
    categories: categories.map((name) => ({
      name,
      color: categoryColors[name],
      count: store.byCategory.get(name)?.length || 0,
    })),
    total: store.total,
  });
});

router.get('/browse', (req, res, next) => {
  try {
    const t0 = performance.now();
    const kind = String(req.query.kind || 'trending');
    const value = String(req.query.value || '');
    const limit = clampLimit(req.query.limit);
    const store = getDataStore();
    let list;
    let pick;

    if (kind === 'related') {
      const base = store.getById(value);
      if (!base) throw httpError(404, 'video_not_found');
      const pool = listFor('category', base.category);
      list = pool;
      const start = (base.id * 37) % pool.length;
      pick = (offset, n) => {
        const out = [];
        for (let i = 0; out.length < n && offset + i < pool.length - 1; i += 1) {
          const v = pool[(start + offset + i) % pool.length];
          if (v.id !== base.id) out.push(v);
        }
        return out;
      };
    } else if (['trending', 'popular', 'new'].includes(kind)) {
      list = listFor(kind);
    } else if (kind === 'category') {
      if (!categories.includes(value)) throw httpError(404, 'unknown_category');
      list = listFor('category', value);
    } else {
      throw httpError(400, 'unknown_kind');
    }

    const sid = `browse:${kind}:${value}`;
    const { slice, nextCursor, offset } = paginate({ sid, list, cursor: req.query.cursor, limit, pick });
    res.json({
      videos: slice.map((v) => publicVideo(v)),
      nextCursor,
      meta: {
        cacheHit: true, reason: 'precomputed-index', latencyMs: round(performance.now() - t0),
        fetched: slice.length, total: list.length, offset, kind, degraded: false, stageMs: {},
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const t0 = performance.now();
    const q = String(req.query.q || '').trim().toLowerCase().slice(0, 60);
    if (!q) return res.json({ videos: [], nextCursor: null, meta: { total: 0, fetched: 0, latencyMs: 0, cacheHit: false } });
    const store = getDataStore();
    const key = `search:${q}`;
    let ids = await sessionCache.get(key);
    const cacheHit = Boolean(ids);
    if (!ids) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const hits = [];
      for (const v of store.videos) {
        v._t ??= `${v.title} ${v.category} ${v.creatorName}`.toLowerCase();
        if (tokens.every((t) => v._t.includes(t))) hits.push(v);
      }
      hits.sort((a, b) => b.views - a.views);
      ids = hits.slice(0, 3000).map((v) => v.id);
      await sessionCache.set(key, ids);
    }
    const sid = `search:${q}`;
    const { slice, nextCursor, offset } = paginate({ sid, list: ids, cursor: req.query.cursor, limit: clampLimit(req.query.limit) });
    res.json({
      videos: slice.map((id) => publicVideo(store.getById(id))),
      nextCursor,
      meta: { cacheHit, reason: cacheHit ? 'cache-hit' : 'scan-100k', latencyMs: round(performance.now() - t0), fetched: slice.length, total: ids.length, offset, degraded: false, stageMs: {} },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/video/:id', (req, res) => {
  const video = getDataStore().getById(req.params.id);
  if (!video) return res.status(404).json({ error: 'video_not_found' });
  res.json({ video: publicVideo(video) });
});

export default router;
