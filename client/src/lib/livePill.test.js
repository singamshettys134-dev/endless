import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowLivePill, resolveFetchedLabel } from './livePill.js';

test('shouldShowLivePill is limited to feed pages', () => {
  assert.equal(shouldShowLivePill('/', 10), true);
  assert.equal(shouldShowLivePill('/trending', 10), true);
  assert.equal(shouldShowLivePill('/category/tech', 10), true);
  assert.equal(shouldShowLivePill('/watch/123', 10), false);
  assert.equal(shouldShowLivePill('/lab', 10), false);
  assert.equal(shouldShowLivePill('/architecture', 10), false);
  assert.equal(shouldShowLivePill('/search', 10), true);
  assert.equal(shouldShowLivePill('/', 0), false);
});

test('resolveFetchedLabel omits the hardcoded total when data is unknown', () => {
  assert.equal(resolveFetchedLabel(null, 240), '240 fetched');
  assert.equal(resolveFetchedLabel(100000, 240), '240 of 100,000 fetched');
});
