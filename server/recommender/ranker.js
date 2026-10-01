import { categories } from '../config.js';
import { getDataStore } from '../data/index.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cosineSimilarity(profile, vector) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < 16; i += 1) {
    const value = vector[i] || 0;
    const weight = profile[i] || 0;
    dot += value * weight;
    normA += value * value;
    normB += weight * weight;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function rankCandidates({ candidateIds, profile }) {
  const store = getDataStore();
  const categoryWeightMap = categories.reduce((acc, category, index) => {
    acc[category] = profile?.[category] || 0;
    return acc;
  }, {});

  const ranked = candidateIds.map((id) => {
    const video = store.getById(id);
    if (!video) return null;

    const ageDays = (Date.now() - video.uploadedAt) / 86400000;
    const popularity = Math.log10(video.views || 1) / 8;
    const relevanceRaw = cosineSimilarity(
      Array.from(video.topicVector).map((value, index) => (value * (profile?.[categories[index % categories.length]] || 1))),
      Array.from(video.topicVector)
    );

    const categoryBoost = categoryWeightMap[video.category] || 0;
    const relevance = clamp((relevanceRaw * 0.7) + (categoryBoost * 0.3), 0, 1);
    const freshness = clamp(Math.exp(-ageDays / 14), 0, 1);
    const quality = clamp(video.quality, 0, 1);
    const score = (0.4 * relevance) + (0.25 * popularity) + (0.2 * freshness) + (0.15 * quality);

    return {
      id: video.id,
      score,
      breakdown: {
        relevance: Number(relevance.toFixed(4)),
        popularity: Number(popularity.toFixed(4)),
        freshness: Number(freshness.toFixed(4)),
        quality: Number(quality.toFixed(4)),
      },
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  return ranked;
}
