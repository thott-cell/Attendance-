import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <Fingerprint className="h-7 w-7" />
          <span className="absolute inset-0 rounded-2xl border-2 border-brand-400/60 animate-ping" />
        </div>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-sm text-ink-400">Loading…</p>
      </motion.div>
    </div>
  );
}
