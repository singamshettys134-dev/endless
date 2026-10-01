import { NavLink } from 'react-router-dom';
import { NAV } from './nav.js';

export default function MobileTabs() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-fg/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Primary">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${isActive ? 'text-fg' : 'text-zinc-500'}`}>
          <Icon className="h-5 w-5" />
          {label.replace('Live ', '')}
        </NavLink>
      ))}
    </nav>
  );
}
