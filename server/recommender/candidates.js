import { categories } from '../config.js';
import { getDataStore } from '../data/index.js';
import { getSessionProfile } from './profile.js';

function stableSeed(sessionId, feedVersion) {
  let hash = 0;
  const input = `${sessionId}:${feedVersion}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), value | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateCandidates({ sessionId, feedVersion = 1, profile, limit = 1500 }) {
  const store = getDataStore();
  const sessionProfile = profile || getSessionProfile(sessionId);
  const totalWeight = Object.values(sessionProfile).reduce((sum, value) => sum + value, 0) || 1;
  const random = seededRandom(stableSeed(sessionId, feedVersion));
  const selected = new Map();
  const categoryPool = [];

  for (const category of categories) {
    const weight = sessionProfile[category] || 0;
    const share = (weight / totalWeight) * (limit * 0.6);
    const pool = store.getIdsByCategory(category);
    const sample = pool.slice(0, Math.max(20, Math.min(pool.length, Math.ceil(share))));
    sample.forEach((id) => categoryPool.push({ id, source: 'profile' }));
  }

  for (const video of store.trending.slice(0, Math.ceil(limit * 0.3))) {
    categoryPool.push({ id: video.id, source: 'trending' });
  }

  for (let i = 0; i < Math.ceil(limit * 0.1); i += 1) {
    const tailIndex = Math.floor(random() * Math.max(1, store.total - 2000));
    const candidateId = store.popularity[Math.min(store.popularity.length - 1, tailIndex + 2000)]?.id || i + 1;
    categoryPool.push({ id: candidateId, source: 'explore' });
  }

  for (const item of categoryPool) {
    selected.set(item.id, item.id);
  }

  const finalList = [...selected.keys()];
  return finalList.slice(0, limit);
}
