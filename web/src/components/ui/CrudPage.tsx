'use client';
import { useState, type ReactNode } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { PageHeader, SearchBar, Button } from './kit';
import { DataTable, type Column } from './DataTable';
import { EntityForm, type FieldDef } from './EntityForm';
import { Modal, useConfirm } from './Modal';
import { Kanban, type KanbanColumn } from './Kanban';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/cn';

// Optional Kanban board configuration. Pass `board` to any CrudPage and it gains
// a Table/Board toggle for free — drag a card between columns to update its
// grouping field (e.g. status), server-side, with a toast.
export type BoardConfig<T> = {
  groupBy: keyof T & string;
  columns: KanbanColumn[];
  renderCard?: (row: T) => ReactNode;
};

// A COMPLETE list+create+edit+delete page from one config. The whole frontend
// of a module — see app/(app)/items/page.tsx.
export function CrudPage<T extends { id: string }>({
  title,
  subtitle,
  singular = 'record',
  resourcePath,
  columns,
  fields,
  initialSort,
  searchPlaceholder,
  labelKey = 'name',
  board,
}: {
  title: string;
  subtitle?: string;
  singular?: string;
  resourcePath: string;
  columns: Column<T>[];
  fields: FieldDef[];
  initialSort?: string;
  searchPlaceholder?: string;
  labelKey?: string;
  board?: BoardConfig<T>;
}) {
  // Board mode needs the full set on one screen, so fetch a larger page there.
  const r = useResource<T>(resourcePath, { initialSort, limit: board ? 100 : undefined });
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [view, setView] = useState<'table' | 'board'>('table');

  async function move(row: T, to: string) {
    if (!board) return;
    try {
      await r.save({ [board.groupBy]: to } as Partial<T>, row);
      toast.success(`${cap(singular)} moved to ${to}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move failed');
    }
  }

  async function save(values: Record<string, unknown>) {
    const isNew = !editing?.id;
    await r.save(values as Partial<T>, editing);
    setEditing(null);
    toast.success(`${cap(singular)} ${isNew ? 'created' : 'updated'}`);
  }

  async function del(row: T) {
    const name = String((row as Record<string, unknown>)[labelKey] ?? 'this record');
    if (!(await confirm({ title: `Delete ${singular}?`, message: `"${name}" will be permanently removed.`, danger: true, confirmLabel: 'Delete' }))) return;
    try {
      await r.remove(row);
      toast.success(`${cap(singular)} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        {board && (
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {(['table', 'board'] as const).map((v) => {
              const Icon = v === 'table' ? Table2 : LayoutGrid;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition',
                    view === v ? 'bg-brand text-white shadow-sm shadow-brand/25' : 'text-fg-muted hover:text-fg'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {v}
                </button>
              );
            })}
          </div>
        )}
      </PageHeader>

      {board && view === 'board' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SearchBar value={r.search} onChange={r.setSearch} placeholder={searchPlaceholder} />
            <Button onClick={() => setEditing({})}>+ New {singular}</Button>
          </div>
          <Kanban<T & Record<string, unknown>>
            columns={board.columns}
            items={r.rows as Array<T & Record<string, unknown>>}
            groupBy={board.groupBy}
            renderCard={board.renderCard as ((row: T & Record<string, unknown>) => ReactNode) | undefined}
            onMove={(row, to) => move(row as T, to)}
          />
        </>
      ) : (
        <DataTable<T>
          columns={columns}
          rows={r.rows}
          loading={r.loading}
          error={r.error}
          onRetry={r.refresh}
          total={r.total}
          page={r.page}
          pages={r.pages}
          onPage={r.setPage}
          search={r.search}
          onSearch={r.setSearch}
          searchPlaceholder={searchPlaceholder}
          sort={r.sort}
          onSort={r.toggleSort}
          filters={r.filters}
          onFilter={r.setFilter}
          onNew={() => setEditing({})}
          newLabel={`+ New ${singular}`}
          onEdit={(row) => setEditing(row)}
          onDelete={del}
          exportName={title.toLowerCase()}
          title={title}
        />
      )}

      <Modal open={!!editing} title={editing?.id ? `Edit ${singular}` : `New ${singular}`} onClose={() => setEditing(null)}>
        {editing && (
          <EntityForm
            fields={fields}
            initial={editing as Record<string, unknown>}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            submitLabel={editing.id ? 'Save changes' : `Create ${singular}`}
          />
        )}
      </Modal>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
