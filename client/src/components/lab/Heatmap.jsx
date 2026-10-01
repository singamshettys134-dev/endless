import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';

/** One cell per video in the dataset. Lit cells are the ones this session actually fetched. */
export default function Heatmap() {
  const { total, fetchedIds, fetchedCount } = useApp();
  const baseRef = useRef(null);
  const topRef = useRef(null);
  const cols = Math.ceil(Math.sqrt(total * 1.8));
  const rows = Math.ceil(total / cols);
  const CELL = 3;

  useEffect(() => {
    const c = baseRef.current;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(255,255,255,0.075)';
    for (let i = 0; i < total; i += 1) ctx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL - 1, CELL - 1);
  }, [total, cols]);

  useEffect(() => {
    const c = topRef.current;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#c7d2fe';
    fetchedIds.current.forEach((id) => {
      const i = id - 1;
      ctx.fillRect((i % cols) * CELL - 2, Math.floor(i / cols) * CELL - 2, CELL + 3, CELL + 3);
    });
  }, [fetchedCount, cols, fetchedIds]);

  const w = cols * CELL;
  const h = rows * CELL;
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0b0b10] ring-1 ring-white/5" style={{ aspectRatio: `${w} / ${h}` }}>
      <canvas ref={baseRef} width={w} height={h} className="absolute inset-0 h-full w-full" />
      <canvas ref={topRef} width={w} height={h} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
