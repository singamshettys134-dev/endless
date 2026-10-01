async function get(path, params = {}, signal) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const res = await fetch(`/api/${path}?${qs}`, { signal });
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const fetchFeed = ({ session, cursor, limit = 20, cache = true, slow = false, fail = false }, signal) =>
  get('feed', { session, cursor, limit, cache: cache ? 'on' : 'off', simulateSlow: slow ? 1 : 0, simulateFail: fail ? 1 : 0 }, signal);

export const fetchBrowse = ({ kind, value, cursor, limit = 20 }, signal) => get('browse', { kind, value, cursor, limit }, signal);
export const fetchSearch = ({ q, cursor, limit = 20 }, signal) => get('search', { q, cursor, limit }, signal);
export const fetchVideo = (id, signal) => get(`video/${id}`, {}, signal);
export const fetchCategories = (signal) => get('categories', {}, signal);
export const fetchMetrics = (signal) => get('metrics', {}, signal);

export function signalInterest(session, category, dwellMs) {
  return fetch('/api/feed/signal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, category, dwellMs }),
    keepalive: true,
  }).catch(() => undefined);
}
