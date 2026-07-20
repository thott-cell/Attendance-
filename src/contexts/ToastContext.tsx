import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconFor = (t: ToastType) =>
  ({
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <X className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-brand-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  })[t];

const ringFor: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-rose-500',
  info: 'border-l-brand-500',
  warning: 'border-l-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[min(92vw,360px)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`glass-strong shadow-glass rounded-2xl px-4 py-3 flex items-start gap-3 border-l-4 ${ringFor[t.type]}`}
            >
              <div className="mt-0.5 shrink-0">{iconFor(t.type)}</div>
              <p className="text-sm font-medium text-ink-800 dark:text-ink-100 flex-1">
                {t.message}
              </p>
              <button
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
