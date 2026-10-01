import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { queueSignal } from '../lib/signals.js';

/** Sends an interest signal when a card stays >60% visible for 1.5 s. */
export function useDwell(category) {
  const { sessionId } = useApp();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer = null;
    let sent = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !sent) {
        timer = setTimeout(() => { sent = true; queueSignal(sessionId, category, 1500); }, 1500);
      } else {
        clearTimeout(timer);
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [sessionId, category]);
  return ref;
}
