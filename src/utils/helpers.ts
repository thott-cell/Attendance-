// Small shared helpers.

import { Timestamp } from 'firebase/firestore';

export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function formatDate(value: any): string {
  try {
    const date =
      value?.toDate?.() ??
      (value instanceof Date ? value : new Date(value));

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value ?? '');
  }
}

export function formatTime(value: any): string {
  try {
    const date =
      value?.toDate?.() ??
      (value instanceof Date ? value : new Date(value));

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value ?? '');
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Combine a YYYY-MM-DD date and HH:mm time into a timestamp (ms). */
export function sessionTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time}:00`).getTime();
}

/** Whether "now" falls within the session's scheduled window. */
export function isWithinSessionWindow(
  date: string,
  startTime: string,
  endTime: string
): 'before' | 'open' | 'after' {

  const now = Date.now();

  const start = sessionTimestamp(date, startTime);
  const end = sessionTimestamp(date, endTime);

  console.log({
    date,
    startTime,
    endTime,
    start,
    end,
    now,
    startDate: new Date(start),
    endDate: new Date(end),
    nowDate: new Date(now)
  });

  if (now < start) return 'before';
  if (now > end) return 'after';

  return 'open';
       }

/**
 * Converts Firestore Timestamp, Date, string or number into milliseconds.
 */
export function toMillis(value: any): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}
