import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '../../utils/helpers';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'brand' | 'emerald' | 'rose' | 'amber' | 'violet';
  hint?: string;
  delay?: number;
}

const accents: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'from-brand-500 to-brand-700 text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15',
  emerald:
    'from-emerald-500 to-emerald-700 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15',
  rose: 'from-rose-500 to-rose-700 text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15',
  amber: 'from-amber-500 to-amber-600 text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15',
  violet:
    'from-violet-500 to-violet-700 text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15',
};

export default function StatCard({
  label,
  value,
  icon,
  accent = 'brand',
  hint,
  delay = 0,
}: StatCardProps) {
  const [grad, text, bg] = accents[accent].split(' ').reduce(
    (acc, cls) => {
      if (cls.startsWith('from-') || cls.startsWith('to-')) acc[0].push(cls);
      else if (cls.startsWith('text-')) acc[1] = cls;
      else acc[2].push(cls);
      return acc;
    },
    [[], '', []] as [string[], string, string[]]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-5 shadow-glass hover:shadow-glow transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-800 dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <div
          className={classNames(
            'grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br shadow-md',
            grad.join(' '),
            text.replace('text-', 'text-')
          )}
        >
          <span className="text-white">{icon}</span>
        </div>
      </div>
      <div className={classNames('mt-4 h-1.5 rounded-full bg-gradient-to-r', grad.join(' '))} />
      <div className={classNames('mt-1 h-1 rounded-full', bg.join(' '))} />
    </motion.div>
  );
}
