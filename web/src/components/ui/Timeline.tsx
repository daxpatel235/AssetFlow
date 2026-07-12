'use client';
import { Circle, type LucideIcon } from 'lucide-react';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

export type TimelineItem = {
  id?: string;
  title: string;
  description?: string;
  time?: string | Date;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
};

const TONES = {
  brand: 'text-brand bg-brand/10',
  green: 'text-green-600 bg-green-500/10',
  red: 'text-red-600 bg-red-500/10',
  blue: 'text-blue-600 bg-blue-500/10',
  gray: 'text-fg-muted bg-surface-2',
};

export function Timeline({ items, emptyLabel = 'No activity yet' }: { items: TimelineItem[]; emptyLabel?: string }) {
  if (!items.length) return <p className="text-sm text-fg-muted py-8 text-center">{emptyLabel}</p>;

  return (
    <ol className="relative">
      {items.map((it, i) => {
        const Icon = it.icon ?? Circle;
        const last = i === items.length - 1;
        return (
          <li key={it.id ?? i} className="flex gap-3 pb-5 last:pb-0 relative">
            {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />}
            <span className={cn('shrink-0 w-8 h-8 rounded-full flex items-center justify-center', TONES[it.tone ?? 'gray'])}>
              <Icon className="w-4 h-4" />
            </span>
            <div className="pt-1 min-w-0">
              <p className="text-sm text-fg">
                <span className="font-medium">{it.title}</span>
                {it.description && <span className="text-fg-muted"> {it.description}</span>}
              </p>
              {it.time && <p className="text-xs text-fg-muted mt-0.5">{timeAgo(it.time)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
