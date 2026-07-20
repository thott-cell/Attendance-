import { Menu, Moon, Sun, CalendarDays } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenu: () => void;
}

export default function Topbar({ title, subtitle, onMenu }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const now = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 glass-strong border-b border-white/40 dark:border-white/10">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-lg bg-ink-100 dark:bg-ink-700/60 text-ink-600 dark:text-ink-200"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink-800 dark:text-white sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-ink-400 sm:text-sm">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-ink-100/70 dark:bg-ink-700/40 px-3 py-2 text-xs font-medium text-ink-500 dark:text-ink-300">
            <CalendarDays className="h-4 w-4" />
            {now}
          </div>
          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-xl bg-ink-100 dark:bg-ink-700/60 text-ink-600 dark:text-amber-300 transition hover:scale-105"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
