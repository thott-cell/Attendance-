// Small shared helpers.

import { Timestamp } from 'firebase/firestore';

export function classNames(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
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

/**
 * Convert a session date and time into a timestamp.
 */
export function sessionTimestamp(
  date: string,
  time: string
): number {
  return new Date(`${date}T${time}:00`).getTime();
}

/**
 * Returns whether the current time is before,
 * during or after the attendance session.
 */
export function isWithinSessionWindow(
  date: string,
  startTime: string,
  endTime: string
): 'before' | 'open' | 'after' {
  const now = Date.now();

  const start = sessionTimestamp(date, startTime);
  const end = sessionTimestamp(date, endTime);

  if (now < start) {
    return 'before';
  }

  if (now > end) {
    return 'after';
  }

  return 'open';
}

/**
 * Convert Firestore Timestamp, Date,
 * string or number into milliseconds.
 */
export function toMillis(value: any): number {
  if (!value) {
    return 0;
  }

  // Firestore Timestamp
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  // Timestamp-like object
  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  // JavaScript Date
  if (value instanceof Date) {
    return value.getTime();
  }

  // Already milliseconds
  if (typeof value === 'number') {
    return value;
  }

  // ISO string
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}