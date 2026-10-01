import { NavLink } from 'react-router-dom';
import { NAV } from './nav.js';
import { useApp } from '../../context/AppContext.jsx';

export default function Sidebar() {
  const { sessionId } = useApp();
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between border-r border-fg/5 p-4 lg:flex">
      <nav className="space-y-1" aria-label="Primary">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-fg/10 text-fg' : 'text-zinc-400 hover:bg-fg/5 hover:text-zinc-100'}`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl border border-fg/10 bg-fg/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Session</p>
        <p className="mt-1 truncate font-mono text-xs text-zinc-300">{sessionId}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Scroll forever. Fetch almost nothing.</p>
      </div>
    </aside>
  );
}
