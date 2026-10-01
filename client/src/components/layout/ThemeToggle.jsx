import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const light = theme === 'light';
  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={light}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
      className="relative flex h-9 w-[68px] shrink-0 items-center rounded-full border border-fg/10 bg-fg/5 p-1 transition hover:border-fg/20"
    >
      <span className={`absolute top-1 h-7 w-7 rounded-full bg-fg shadow transition-all duration-300 ${light ? 'left-[35px]' : 'left-1'}`} />
      <Moon className={`relative z-10 ml-[7px] h-4 w-4 transition-colors ${light ? 'text-zinc-500' : 'text-ink'}`} />
      <Sun className={`relative z-10 ml-[14px] h-4 w-4 transition-colors ${light ? 'text-ink' : 'text-zinc-500'}`} />
    </button>
  );
}
