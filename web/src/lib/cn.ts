// Tiny className combiner. cn('px-2', active && 'bg-brand')
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
