import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Auto-loading paginated list. No buttons, no reloads.
 *  - A sentinel near the bottom (IntersectionObserver) loads more automatically.
 *  - Prefetch ON: the next batch is always fetched in the background one page ahead and
 *    flushed instantly when the sentinel (1600px before the end) is reached.
 *  - The observer is re-created after every change, so a screen that is still not full keeps loading.
 *
 * fetcher(cursor, epoch, signal) -> { videos, nextCursor, meta }
 * loop: when the server runs out of pages, restart seamlessly with a new epoch (truly endless).
 */
export function useInfiniteList({ fetcher, deps = [], source, loop = false, track = false }) {
  const { settings, report, setPrefetchState } = useApp();
  const prefetchOn = settings.prefetch;

  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | idle | error | done
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  const cursor = useRef(null);
  const epoch = useRef(0);
  const done = useRef(false);
  const buffer = useRef([]);
  const inflight = useRef(null);
  const prefetching = useRef(null);
  const loadingMore = useRef(false);
  const gen = useRef(0);
  const seen = useRef(new Set());
  const batchNo = useRef(0);
  const abort = useRef(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const prefetchRef = useRef(prefetchOn);
  prefetchRef.current = prefetchOn;

  const request = useCallback(() => {
    if (inflight.current) return inflight.current;
    if (done.current) return Promise.resolve(null);
    const myGen = gen.current;
    const ctrl = new AbortController();
    abort.current = ctrl;
    const p = (async () => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const res = await fetcherRef.current(cursor.current, epoch.current, ctrl.signal);
          if (myGen !== gen.current) return null;
          cursor.current = res.nextCursor;
          if (!res.nextCursor) {
            if (loop) { epoch.current += 1; cursor.current = null; } else done.current = true;
          }
          return res;
        } catch (e) {
          if (e.name === 'AbortError' || myGen !== gen.current) return null;
          if (attempt >= 3) throw e;
          await sleep(400 * 2 ** attempt);
        }
      }
    })().finally(() => { inflight.current = null; });
    inflight.current = p;
    return p;
  }, [loop]);

  const append = useCallback((res, prefetched) => {
    const fresh = res.videos.filter((v) => !seen.current.has(v.id));
    fresh.forEach((v) => seen.current.add(v.id));
    batchNo.current += 1;
    const n = batchNo.current;
    setPages((prev) => [...prev, { n, videos: fresh, meta: res.meta, prefetched, epoch: epoch.current }]);
    if (track) report({ source, meta: res.meta, prefetched, videos: fresh, cursor: res.nextCursor, batch: n });
  }, [report, source, track]);

  const runPrefetch = useCallback(() => {
    if (!prefetchRef.current || done.current || buffer.current.length >= 1 || prefetching.current || inflight.current) return;
    if (track) setPrefetchState('prefetching');
    const myGen = gen.current;
    const p = (async () => {
      try {
        const res = await request();
        if (res && myGen === gen.current) {
          buffer.current.push(res);
          if (track) setPrefetchState('ready');
        }
      } catch {
        if (track) setPrefetchState('idle');
      }
    })().finally(() => { prefetching.current = null; });
    prefetching.current = p;
  }, [request, setPrefetchState, track]);

  const loadNext = useCallback(async () => {
    if (loadingMore.current || (done.current && !buffer.current.length)) return;
    loadingMore.current = true;
    const myGen = gen.current;
    try {
      if (!buffer.current.length) {
        setStatus('loading');
        if (prefetching.current) await prefetching.current;
        else if (inflight.current) await inflight.current;
      }
      if (myGen !== gen.current) return;
      if (buffer.current.length) {
        append(buffer.current.shift(), true);
        if (track) setPrefetchState('idle');
      } else {
        const res = await request();
        if (!res || myGen !== gen.current) return;
        append(res, false);
      }
      setStatus(done.current && !buffer.current.length ? 'done' : 'idle');
      setError(null);
      runPrefetch();
    } catch (e) {
      if (myGen === gen.current) { setError(e); setStatus('error'); }
    } finally {
      loadingMore.current = false;
    }
  }, [append, request, runPrefetch, setPrefetchState, track]);

  // reset whenever the data source changes
  useEffect(() => {
    gen.current += 1;
    abort.current?.abort();
    cursor.current = null; epoch.current = 0; done.current = false;
    buffer.current = []; inflight.current = null; prefetching.current = null;
    loadingMore.current = false; seen.current = new Set(); batchNo.current = 0;
    setPages([]); setError(null); setStatus('loading');
    if (track) setPrefetchState('idle');
    loadNext();
    return () => { gen.current += 1; abort.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // switching prefetch ON starts filling the buffer right away
  useEffect(() => { if (prefetchOn && status === 'idle') runPrefetch(); }, [prefetchOn, status, runPrefetch]);

  // auto-load sentinel: re-created after every change so it fires again while still visible
  const itemCount = pages.reduce((n, p) => n + p.videos.length, 0);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || status === 'done' || status === 'error') return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadNext();
    }, { rootMargin: prefetchOn ? '1600px 0px' : '0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [itemCount, status, prefetchOn, loadNext]);

  // network returned after a failure: resume automatically
  useEffect(() => {
    const onOnline = () => { if (status === 'error') loadNext(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [status, loadNext]);

  return { pages, status, error, sentinelRef, retry: loadNext, itemCount };
}
