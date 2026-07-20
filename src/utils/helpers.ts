// Small shared helpers.

export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
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
  if (now < start) return 'before';
  if (now > end) return 'after';
  return 'open';
  }
