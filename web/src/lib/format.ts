const LOCALE = 'en-US';

export function formatCurrency(value: number | string, currency = 'USD'): string {
  const n = Number(value);
  return Number.isNaN(n) ? '—' : new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(n);
}

export function formatDate(value: string | number | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(LOCALE, opts).format(d);
}

export function timeAgo(value: string | number | Date): string {
  if (!value) return '';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit);
  }
  return '';
}

export const titleCase = (s = ''): string => s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// "Ada Lovelace" -> "AL". Used by <Avatar>. Falls back to "?" for empty names.
export const initials = (name = ''): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
