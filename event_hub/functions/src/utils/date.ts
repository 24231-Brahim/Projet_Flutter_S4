export function formatDate(date: Date | FirebaseFirestore.Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | FirebaseFirestore.Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(date: Date | FirebaseFirestore.Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | FirebaseFirestore.Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateRange(
  start: Date | FirebaseFirestore.Timestamp,
  end: Date | FirebaseFirestore.Timestamp
): string {
  return `${formatDateTime(start)} - ${formatTime(end)}`;
}

export function getTimeUntil(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
} {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  return {
    days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60)),
    isPast,
  };
}

export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hoursInMs = hours * 60 * 60 * 1000;
  return diff > 0 && diff <= hoursInMs;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
