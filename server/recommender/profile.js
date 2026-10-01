import { categories } from '../config.js';

const sessionProfiles = new Map();
const sessionVersions = new Map();

function uniformProfile() {
  const profile = {};
  for (const category of categories) {
    profile[category] = 1;
  }
  return profile;
}

export function getSessionProfile(sessionId) {
  const profile = sessionProfiles.get(sessionId) || uniformProfile();
  const normalized = {};
  const total = Object.values(profile).reduce((sum, value) => sum + value, 0) || 1;
  for (const category of categories) {
    normalized[category] = (profile[category] || 0) / total;
  }
  return normalized;
}

export function getSessionVersion(sessionId) {
  return sessionVersions.get(sessionId) || 1;
}

export function bumpSessionVersion(sessionId) {
  const next = (sessionVersions.get(sessionId) || 1) + 1;
  sessionVersions.set(sessionId, next);
  return next;
}

export function updateSessionProfile(sessionId, { category, dwellMs = 0 }) {
  const existing = sessionProfiles.get(sessionId) || uniformProfile();
  const next = { ...existing };
  const categoryValue = dwellMs > 0 ? Math.min(8, Math.max(1, Math.log10(dwellMs + 1) * 3 + (next[category] || 1))) : (next[category] || 1) + 0.5;
  next[category] = categoryValue;
  for (const item of categories) {
    if (item !== category) {
      next[item] = Math.max(0.2, (next[item] || 1) * 0.96);
    }
  }
  sessionProfiles.set(sessionId, next);
  return next;
}

export function clearSessionProfile(sessionId) {
  sessionProfiles.delete(sessionId);
  sessionVersions.delete(sessionId);
}

export function seedColdStartProfile() {
  const profile = {};
  for (const category of categories) {
    profile[category] = 1.1 + Math.random() * 0.7;
  }
  const trendingBoost = { Gaming: 1.25, Music: 1.2, Cricket: 1.3, News: 1.18, Tech: 1.25, Fitness: 1.1 };
  for (const [category, boost] of Object.entries(trendingBoost)) {
    profile[category] = (profile[category] || 1) + boost;
  }
  return profile;
}
