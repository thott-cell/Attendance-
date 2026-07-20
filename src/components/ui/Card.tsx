import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '../../utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  delay?: number;
}

export default function Card({ children, className, hover = false, delay = 0, ...rest }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -4 } : undefined}
      className={classNames(
        'glass rounded-2xl shadow-glass p-5',
        hover && 'transition-shadow hover:shadow-glow cursor-pointer',
        className
      )}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}
