import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { TOTAL_FALLBACK, formatCount } from '../../lib/constants.js';

export default function Topbar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { sessionId, newSession } = useApp();
  const [q, setQ] = useState(params.get('q') || '');
  useEffect(() => setQ(params.get('q') || ''), [params]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-fg/5 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Endless home">
          <Logo />
          <span className="hidden text-lg font-extrabold tracking-tight sm:block">Endless</span>
        </Link>
        <form onSubmit={submit} role="search" className="mx-auto flex w-full max-w-xl items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${formatCount(TOTAL_FALLBACK)} videos`}
              aria-label="Search videos"
              className="h-11 w-full rounded-full border border-fg/10 bg-fg/[0.04] pl-11 pr-4 text-sm text-fg placeholder:text-zinc-500 shadow-inner shadow-black/10 transition focus:border-indigo-400/60 focus:bg-fg/[0.06] focus:outline-none"
            />
          </div>
        </form>
        <button
          onClick={() => { newSession(); navigate('/'); }}
          title={`Session ${sessionId}. Click to start a new one`}
          className="flex shrink-0 items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">New session</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
