import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="glass-strong relative w-full max-w-md rounded-2xl p-6 shadow-glass"
          >
            <div className="flex items-start gap-4">
              <div
                className={
                  variant === 'danger'
                    ? 'h-11 w-11 rounded-full bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center'
                    : 'h-11 w-11 rounded-full bg-brand-100 dark:bg-brand-500/15 flex items-center justify-center'
                }
              >
                <AlertTriangle
                  className={
                    variant === 'danger'
                      ? 'h-5 w-5 text-rose-600 dark:text-rose-400'
                      : 'h-5 w-5 text-brand-600 dark:text-brand-400'
                  }
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
                <div className="mt-1 text-sm text-ink-500 dark:text-ink-300">{message}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
