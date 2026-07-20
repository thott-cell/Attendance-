import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unexpected error' };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('BioAttend render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950 p-6">
          <div className="glass-strong max-w-md rounded-2xl p-8 text-center shadow-glass">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 dark:bg-rose-500/15 text-rose-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-ink-800 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              {this.state.message ?? 'An unexpected error occurred.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => location.reload()}>
                Reload
              </Button>
              <Button onClick={() => (window.location.href = '/login')}>Go to Login</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
