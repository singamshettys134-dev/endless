import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { flushSignals } from '../lib/signals.js';

const AppContext = createContext(null);
const KEY = 'endless-session';
const makeSession = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function initialSession() {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = makeSession();
    sessionStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return makeSession();
  }
}

export function AppProvider({ children }) {
  const [sessionId, setSessionId] = useState(initialSession);
  const [settings, setSettingsState] = useState({ cache: true, prefetch: true, slow: false, fail: false });
  const settingsRef = useRef(settings);
  const [log, setLog] = useState([]);
  const [profile, setProfile] = useState(null);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [total, setTotal] = useState(null);
  const fetchedIds = useRef(new Set());
  const [prefetchState, setPrefetchState] = useState('idle');
  const [lastCursor, setLastCursor] = useState(null);

  const setSetting = useCallback((key, value) => {
    settingsRef.current = { ...settingsRef.current, [key]: value };
    setSettingsState(settingsRef.current);
  }, []);

  const report = useCallback((entry) => {
    entry.videos?.forEach((v) => fetchedIds.current.add(v.id));
    setFetchedCount(fetchedIds.current.size);
    if (entry.source === 'home') {
      if (entry.meta?.profile) setProfile(entry.meta.profile);
      if (entry.cursor !== undefined) setLastCursor(entry.cursor);
      if (entry.meta?.total != null) setTotal(Number(entry.meta.total) || null);
    }
    const { videos, ...rest } = entry;
    setLog((prev) => [...prev.slice(-199), { ...rest, t: Date.now(), ids: videos?.map((v) => v.id) || [] }]);
  }, []);

  const newSession = useCallback(() => {
    flushSignals();
    const fresh = makeSession();
    try { sessionStorage.setItem(KEY, fresh); } catch { /* ignore */ }
    fetchedIds.current = new Set();
    setFetchedCount(0);
    setLog([]);
    setProfile(null);
    setTotal(null);
    setLastCursor(null);
    setSessionId(fresh);
  }, []);

  const value = useMemo(() => ({
    sessionId, newSession, settings, settingsRef, setSetting, log, report, profile, fetchedCount,
    fetchedIds, total, prefetchState, setPrefetchState, lastCursor,
  }), [sessionId, newSession, settings, setSetting, log, report, profile, fetchedCount, total, prefetchState, lastCursor]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
