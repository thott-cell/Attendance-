import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { classNames } from '../../utils/helpers';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

const baseField =
  'w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-800/60 ' +
  'px-4 py-2.5 text-sm text-ink-800 dark:text-ink-100 placeholder:text-ink-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 transition';

export function Input({
  label,
  hint,
  error,
  icon,
  className,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </span>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
        )}
        <input
          className={classNames(baseField, icon ? 'pl-10' : '', error && 'border-rose-500', className)}
          {...rest}
        />
      </div>
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </span>
      )}
      <textarea className={classNames(baseField, 'resize-none', error && 'border-rose-500', className)} {...rest} />
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </span>
      )}
      <select className={classNames(baseField, 'appearance-none', error && 'border-rose-500', className)} {...rest}>
        {children}
      </select>
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}
