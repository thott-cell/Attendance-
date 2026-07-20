import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  loading?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  empty = 'No records found.',
  loading = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl glass shadow-glass">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200/70 dark:border-ink-700/60 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-5 py-3.5 font-semibold text-ink-500 dark:text-ink-300 whitespace-nowrap ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-ink-400">
                Loading…
              </td>
            </tr>
          )}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-ink-400">
                {empty}
              </td>
            </tr>
          )}
          {!loading &&
            data.map((row, i) => (
              <motion.tr
                key={rowKey(row)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                className="border-b border-ink-100/70 dark:border-ink-800/60 last:border-0 hover:bg-ink-50/60 dark:hover:bg-ink-700/30 transition-colors"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3 align-middle ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </motion.tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
