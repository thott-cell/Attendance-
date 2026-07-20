import { classNames } from '../../utils/helpers';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('skeleton', className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 shadow-glass">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-32" />
    </div>
  );
}
