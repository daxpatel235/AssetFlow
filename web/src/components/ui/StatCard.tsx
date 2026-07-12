'use client';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './kit';
import { Sparkline } from './Chart';
import { cn } from '@/lib/cn';

const TONES = {
  brand: 'bg-brand/10 text-brand',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

// Concrete stroke colors for the sparkline (SVG needs a value, not a class).
const SPARK: Record<keyof typeof TONES, string> = {
  brand: '#2563eb', green: '#059669', blue: '#3b82f6', amber: '#d97706', yellow: '#ca8a04', purple: '#9333ea', red: '#dc2626',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  delta,
  spark,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
  hint?: string;
  delta?: number; // % change; renders an up/down pill when provided
  spark?: number[]; // optional trend series → sparkline hugging the card's base
}) {
  const showDelta = typeof delta === 'number' && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="group overflow-hidden flex flex-col transition-all duration-200 ease-spring hover:border-brand/40 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-fg-muted">{label}</p>
          <p className="text-3xl font-bold mt-1 text-fg tracking-tight tabular-nums">{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {showDelta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold tabular-nums',
                  up ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}
              >
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta as number)}%
              </span>
            )}
            {hint && <p className="text-xs text-fg-muted truncate">{hint}</p>}
          </div>
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl ring-1 ring-inset ring-current/10 transition-transform duration-200 ease-spring group-hover:scale-110 group-hover:-rotate-3', TONES[tone])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-3 -mx-5 -mb-5 h-10">
          <Sparkline data={spark} stroke={SPARK[tone]} />
        </div>
      )}
    </Card>
  );
}
