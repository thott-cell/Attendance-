import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  CalendarClock,
  ScanFace,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Fingerprint,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { classNames } from '../../utils/helpers';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/register', label: 'Register Student', icon: UserPlus },
  { to: '/sessions', label: 'Attendance Session', icon: CalendarClock },
  { to: '/live', label: 'Live Attendance', icon: ScanFace },
  { to: '/records', label: 'Attendance Records', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={classNames(
          'fixed lg:static z-40 h-full w-72 shrink-0 transform transition-transform duration-300',
          'glass-strong border-r border-white/40 dark:border-white/10',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink-800 dark:text-white">
                  BioAttend
                </p>
                <p className="text-[11px] uppercase tracking-wider text-ink-400">
                  Attendance Suite
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  classNames(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'text-ink-500 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand-500"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div className="border-t border-ink-200/60 dark:border-ink-700/60 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-ink-100/60 dark:bg-ink-700/40 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-semibold">
                {(profile?.fullName?.[0] ?? 'L').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-700 dark:text-ink-100">
                  {profile?.fullName ?? 'Lecturer'}
                </p>
                <p className="truncate text-xs text-ink-400">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
