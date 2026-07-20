import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../utils/helpers';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white shadow-glow disabled:bg-brand-400',
  secondary:
    'glass hover:bg-white/90 dark:hover:bg-ink-700/70 text-ink-700 dark:text-ink-100',
  ghost: 'hover:bg-ink-100 dark:hover:bg-ink-700/50 text-ink-600 dark:text-ink-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-70',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
