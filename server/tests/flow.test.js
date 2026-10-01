import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeCursor, decodeCursor } from '../cursor.js';
import { rerankWithMmr } from '../recommender/reranker.js';
import { sessionCache } from '../cache/sessionCache.js';

const sampleItems = [
  { id: 1, score: 0.88, category: 'Tech', creatorId: 'a' },
  { id: 2, score: 0.84, category: 'Tech', creatorId: 'a' },
  { id: 3, score: 0.8, category: 'Tech', creatorId: 'b' },
  { id: 4, score: 0.71, category: 'Gaming', creatorId: 'c' },
  { id: 5, score: 0.61, category: 'Gaming', creatorId: 'd' },
  { id: 6, score: 0.56, category: 'Music', creatorId: 'e' },
  { id: 7, score: 0.54, category: 'Music', creatorId: 'f' },
  { id: 8, score: 0.5, category: 'Cricket', creatorId: 'g' },
];

test('cursor round-trips without mutation', () => {
  const token = encodeCursor({ sid: 'session-123', offset: 5, feedVersion: 2, lastScore: 0.42 });
  const decoded = decodeCursor(token);
  assert.equal(decoded.valid, true);
  assert.equal(decoded.payload.offset, 5);
  assert.equal(decoded.payload.feedVersion, 2);
});

test('cursor rejects tampering', () => {
  const token = encodeCursor({ sid: 'session-123', offset: 5, feedVersion: 2, lastScore: 0.42 });
  const invalid = `${token.slice(0, -1)}x`;
  const decoded = decodeCursor(invalid);
  assert.equal(decoded.valid, false);
});

test('mmr keeps every item and obeys sliding-window rules', () => {
  const cats = ['Tech', 'Gaming', 'Music', 'Cricket', 'News', 'Travel'];
  const items = Array.from({ length: 600 }, (_, i) => ({
    id: i + 1,
    score: 1 - i / 700,
    category: cats[Math.floor(i / 7) % cats.length], // long same-category runs in the input
    creatorId: `c${i % 40}`,
  })).sort((a, b) => b.score - a.score);

  const result = rerankWithMmr(items, [5, 6]);
  assert.equal(result.length, 598, 'must not truncate the list');
  assert.ok(!result.some((r) => r.id === 5 || r.id === 6), 'seen ids dropped');

  let run = 1;
  for (let i = 1; i < result.length; i += 1) {
    run = result[i].category === result[i - 1].category ? run + 1 : 1;
    assert.ok(run <= 2, `more than 2 consecutive from ${result[i].category} at ${i}`);
  }
  for (let start = 0; start + 30 <= result.length; start += 1) {
    const counts = new Map();
    for (const r of result.slice(start, start + 30)) counts.set(r.creatorId, (counts.get(r.creatorId) || 0) + 1);
    assert.ok([...counts.values()].every((c) => c <= 3), `creator cap broken in window ${start}`);
  }
});

test('feed pool is large enough to page for a long time', async () => {
  const { getFeedData } = await import('../routes/feed.js');
  const first = await getFeedData({ sessionId: 'pool-test', limit: 20 });
  assert.ok(first.meta.poolSize >= 1000, `pool was only ${first.meta.poolSize}`);
  assert.ok(first.nextCursor);
});

test('session cache respects TTL', async () => {
  sessionCache.local.set('ttl-check', { ok: true }, { ttl: 10 });
  await new Promise((resolve) => setTimeout(resolve, 30));
  const value = await sessionCache.get('ttl-check');
  assert.equal(value, undefined);
});

test('re-rank mid-scroll never repeats videos already served', async () => {
  const { getFeedData } = await import('../routes/feed.js');
  const { updateSessionProfile, bumpSessionVersion } = await import('../recommender/profile.js');
  const sid = 'rebase-test';
  const served = new Set();
  let cursor = null;
  for (let round = 0; round < 4; round += 1) {
    const page = await getFeedData({ sessionId: sid, cursorToken: cursor, limit: 20 });
    for (const v of page.videos) {
      assert.ok(!served.has(v.id), `video ${v.id} repeated in round ${round}`);
      served.add(v.id);
    }
    cursor = page.nextCursor;
    // user signals interest -> feedVersion bumps between pages
    updateSessionProfile(sid, { category: ['Cricket', 'Gaming', 'Music', 'Tech'][round], dwellMs: 30000 });
    bumpSessionVersion(sid);
  }
  const next = await getFeedData({ sessionId: sid, cursorToken: cursor, limit: 20 });
  assert.equal(next.meta.rebased, true);
  assert.equal(served.size, 80);
});
