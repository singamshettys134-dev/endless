import { signalInterest } from './api.js';

// Batches dwell signals so the profile updates at most every few seconds.
const pending = new Map();
let timer = null;

export function queueSignal(session, category, dwellMs) {
  const key = `${session}|${category}`;
  pending.set(key, (pending.get(key) || 0) + dwellMs);
  if (!timer) timer = setTimeout(flushSignals, 5000);
}

export function flushSignals() {
  clearTimeout(timer);
  timer = null;
  for (const [key, ms] of pending) {
    const [session, category] = key.split('|');
    signalInterest(session, category, ms);
  }
  pending.clear();
}
