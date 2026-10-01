import { getDataStore } from '../data/index.js';

const LOOKAHEAD = 60; // MMR only needs to consider the best few dozen remaining candidates per pick
const SIM_WINDOW = 8; // similarity is measured against the most recent picks
const MAX_RUN = 2; // max consecutive items from one category
const CREATOR_WINDOW = 30;
const MAX_PER_CREATOR = 3;

/**
 * Greedy MMR re-ranking: mmr = lambda * score - (1 - lambda) * maxSimilarity(recent picks).
 * Hard rules are applied as sliding-window constraints (never as global caps, which would
 * truncate the list): at most 2 in a row from one category, at most 3 per creator in any
 * 30 consecutive items. If the rules cannot be met (pool exhausted), they are relaxed so the
 * list is never shortened. Already-seen ids are dropped.
 *
 * @param {{id:number, score:number, category?:string, creatorId?:string}[]} items sorted by score desc
 * @param {number[]} seenIds ids to exclude
 * @param {number} lambda relevance vs. diversity trade-off
 */
export function rerankWithMmr(items, seenIds = [], lambda = 0.75) {
  const store = getDataStore();
  const seen = new Set(seenIds);
  const category = (item) => item.category || store.getById(item.id)?.category;
  const creator = (item) => item.creatorId || store.getById(item.id)?.creatorId;

  const remaining = items
    .filter((item) => !seen.has(item.id))
    .map((item) => ({ item, cat: category(item), cre: creator(item) }));
  const out = [];
  const creatorCounts = new Map(); // creator -> count within the last CREATOR_WINDOW picks

  while (remaining.length) {
    const recent = out.slice(-SIM_WINDOW);
    const lastCat = out.at(-1)?.cat;
    const runLength = (() => {
      let n = 0;
      for (let i = out.length - 1; i >= 0 && out[i].cat === lastCat; i -= 1) n += 1;
      return n;
    })();

    let bestIdx = -1;
    let bestScore = -Infinity;
    let scanned = 0;
    for (let i = 0; i < remaining.length && scanned < LOOKAHEAD; i += 1) {
      const cand = remaining[i];
      if (cand.cat === lastCat && runLength >= MAX_RUN) continue;
      if ((creatorCounts.get(cand.cre) || 0) >= MAX_PER_CREATOR) continue;
      scanned += 1;
      let maxSim = 0;
      for (const r of recent) maxSim = Math.max(maxSim, r.cat === cand.cat ? 0.7 : 0.18);
      const mmr = lambda * cand.item.score - (1 - lambda) * maxSim;
      if (mmr > bestScore) { bestScore = mmr; bestIdx = i; }
    }
    if (bestIdx === -1) bestIdx = 0; // constraints unsatisfiable: relax rather than truncate

    const [picked] = remaining.splice(bestIdx, 1);
    out.push(picked);
    creatorCounts.set(picked.cre, (creatorCounts.get(picked.cre) || 0) + 1);
    if (out.length > CREATOR_WINDOW) {
      const gone = out[out.length - 1 - CREATOR_WINDOW];
      creatorCounts.set(gone.cre, (creatorCounts.get(gone.cre) || 1) - 1);
    }
  }

  return out.map(({ item }) => item);
}
