'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './kit';
import { cn } from '@/lib/cn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Lightweight month calendar. Pass events keyed by a date field.
export function Calendar<T extends Record<string, unknown>>({
  events,
  dateKey,
  titleKey,
  onDayClick,
  onEventClick,
}: {
  events: T[];
  dateKey: keyof T;
  titleKey: keyof T;
  onDayClick?: (date: Date) => void;
  onEventClick?: (row: T) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startPad = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = iso(new Date());

  const byDay: Record<string, T[]> = {};
  for (const ev of events) {
    const raw = ev[dateKey];
    if (!raw) continue;
    const key = String(raw).slice(0, 10);
    (byDay[key] ||= []).push(ev);
  }

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-fg">{cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-1">
          <IconButton onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => setCursor(new Date())} title="Today">
            <span className="text-xs">Today</span>
          </IconButton>
          <IconButton onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-fg-muted py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = iso(date);
          const dayEvents = byDay[key] ?? [];
          const isToday = key === today;
          return (
            <button
              key={i}
              onClick={() => onDayClick?.(date)}
              className={cn('min-h-[72px] rounded-lg border p-1.5 text-left align-top transition hover:border-brand/50', isToday ? 'border-brand bg-brand/5' : 'border-border')}
            >
              <span className={cn('text-xs', isToday ? 'text-brand font-semibold' : 'text-fg-muted')}>{date.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev, j) => (
                  <div
                    key={j}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(ev);
                    }}
                    className="text-[10px] truncate px-1 py-0.5 rounded bg-brand/15 text-brand"
                  >
                    {String(ev[titleKey] ?? 'Event')}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-[10px] text-fg-muted px-1">+{dayEvents.length - 3} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
