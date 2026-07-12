'use client';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type KanbanColumn = { key: string; label: string; color?: string };

// Drag-and-drop board (zero-dep, HTML5 DnD). Group any records by a status
// field and move them between columns.
//   <Kanban columns={COLS} items={rows} groupBy="status"
//     renderCard={(r) => <div>{r.title}</div>}
//     onMove={(row, to) => update(row.id, { status: to })} />
export function Kanban<T extends { id: string } & Record<string, unknown>>({
  columns,
  items,
  groupBy,
  renderCard,
  onMove,
}: {
  columns: KanbanColumn[];
  items: T[];
  groupBy: keyof T;
  renderCard?: (row: T) => ReactNode;
  onMove?: (row: T, toStatus: string) => void;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = (colKey: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const row = items.find((it) => it.id === id);
    if (row && String(row[groupBy]) !== colKey) onMove?.(row, colKey);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((col) => {
        const colItems = items.filter((it) => String(it[groupBy]) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col.key);
            }}
            onDragLeave={() => setDragOver((c) => (c === col.key ? null : c))}
            onDrop={(e) => handleDrop(col.key, e)}
            className={cn('w-72 shrink-0 rounded-xl border p-3 transition', dragOver === col.key ? 'border-brand bg-brand/5' : 'border-border bg-surface-2')}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-medium text-sm text-fg flex items-center gap-2">
                {col.color && <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />}
                {col.label}
              </span>
              <span className="text-xs text-fg-muted bg-surface rounded-full px-2 py-0.5">{colItems.length}</span>
            </div>
            <div className="space-y-2 min-h-[3rem]">
              {colItems.map((row) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}
                  className="bg-surface border border-border rounded-lg p-3 text-sm text-fg shadow-card cursor-grab active:cursor-grabbing hover:border-brand/50"
                >
                  {renderCard ? renderCard(row) : String(row.title ?? row.name ?? row.id)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
