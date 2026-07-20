import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Attendance overview at a glance' },
  '/register': { title: 'Register Student', subtitle: 'Enroll a new student with facial recognition' },
  '/sessions': { title: 'Attendance Session', subtitle: 'Create and manage class sessions' },
  '/live': { title: 'Live Attendance', subtitle: 'Real-time facial recognition check-in' },
  '/records': { title: 'Attendance Records', subtitle: 'Search and filter attendance history' },
  '/reports': { title: 'Reports', subtitle: 'Insights, charts and exports' },
  '/settings': { title: 'Settings', subtitle: 'Manage your profile and preferences' },
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = titles[location.pathname] ?? { title: 'BioAttend', subtitle: '' };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-ink-50 via-ink-100/60 to-brand-50/40 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={meta.title} subtitle={meta.subtitle} onMenu={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
