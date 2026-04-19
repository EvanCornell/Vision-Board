import { format, formatDistanceToNow, isPast, differenceInDays, parseISO } from 'date-fns';

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch {
    return date;
  }
}

export function formatRelative(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  try {
    return isPast(parseISO(date));
  } catch {
    return false;
  }
}

export function getDaysUntil(date: string): number {
  try {
    return differenceInDays(parseISO(date), new Date());
  } catch {
    return 0;
  }
}

export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
