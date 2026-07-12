'use client';
import { type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, Download, Printer, QrCode } from 'lucide-react';
import { SearchBar, EmptyState, Button, Select, IconButton } from './kit';
import { TableSkeleton, ErrorState } from './feedback';
import { exportToCSV, exportToExcel, exportToPDF, exportQRLabelsPDF, printPage } from '@/lib/export';
import { cn } from '@/lib/cn';

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  filter?: string[];
  align?: 'right';
  export?: boolean;
  exportValue?: (row: T) => string | number;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: { message: string } | null;
  onRetry?: () => void;
  total?: number;
  page?: number;
  pages?: number;
  onPage?: (p: number) => void;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  sort?: string;
  onSort?: (key: string) => void;
  filters?: Record<string, string>;
  onFilter?: (key: string, value: string) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onNew?: () => void;
  newLabel?: string;
  exportName?: string;
  title?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  error = null,
  onRetry,
  total = 0,
  page = 1,
  pages = 1,
  onPage,
  search,
  onSearch,
  searchPlaceholder,
  sort,
  onSort,
  filters = {},
  onFilter,
  onEdit,
  onDelete,
  onNew,
  newLabel = '+ New',
  exportName = 'export',
  title,
}: Props<T>) {
  const filterColumns = columns.filter((c) => c.filter);
  const hasActions = !!(onEdit || onDelete);
  const sortDir = (key: string) => (sort === key ? 'asc' : sort === `-${key}` ? 'desc' : null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {onSearch && <SearchBar value={search ?? ''} onChange={onSearch} placeholder={searchPlaceholder} />}
          {filterColumns.map((c) => (
            <Select
              key={c.key}
              value={filters[c.key] ?? ''}
              onChange={(e) => onFilter?.(c.key, e.target.value)}
              options={c.filter}
              placeholder={`All ${c.label}`}
              className="w-auto min-w-[8rem]"
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <IconButton title="Export CSV" onClick={() => exportToCSV(columns, rows, exportName)}>
            <Download className="w-4 h-4" />
          </IconButton>
          <IconButton title="Export Excel" onClick={() => exportToExcel(columns, rows, exportName)} className="text-green-600">
            <span className="text-xs font-semibold">XLS</span>
          </IconButton>
          <IconButton title="Export PDF" onClick={() => exportToPDF(columns, rows, exportName, title)} className="text-red-600">
            <span className="text-xs font-semibold">PDF</span>
          </IconButton>
          <IconButton title="Export QR Labels" onClick={() => exportQRLabelsPDF(rows as any, `${exportName}-qrs`)} className="text-brand">
            <QrCode className="w-4 h-4" />
          </IconButton>
          <IconButton title="Print" onClick={printPage}>
            <Printer className="w-4 h-4" />
          </IconButton>
          {onNew && <Button onClick={onNew}>{newLabel}</Button>}
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={columns.length} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={onRetry} />
      ) : (
        <>
        <div className="hidden md:block bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-fg-muted">
                <tr>
                  {columns.map((c) => {
                    const dir = sortDir(c.key);
                    return (
                      <th
                        key={c.key}
                        className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wider', c.align === 'right' && 'text-right', c.sortable && onSort && 'cursor-pointer select-none hover:text-fg transition-colors')}
                        onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
                      >
                        <span className={cn('inline-flex items-center gap-1', c.align === 'right' && 'flex-row-reverse')}>
                          {c.label}
                          {c.sortable && onSort && (dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand" /> : dir === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-brand" /> : <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />)}
                        </span>
                      </th>
                    );
                  })}
                  {hasActions && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-surface-2/60 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-3 text-fg', c.align === 'right' && 'text-right')}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="text-brand hover:underline mr-3">
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="text-red-600 hover:underline">
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <EmptyState hint="Create your first record." />}
        </div>

        {/* Mobile: each row becomes a card of label → value pairs */}
        <div className="md:hidden space-y-3">
          {rows.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border"><EmptyState hint="Create your first record." /></div>
          ) : rows.map((row) => (
            <div key={row.id} className="bg-surface rounded-2xl border border-border p-4">
              <div className="space-y-2.5">
                {columns.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted shrink-0 pt-0.5">{c.label}</span>
                    <span className="text-sm text-fg text-right min-w-0">{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}</span>
                  </div>
                ))}
              </div>
              {hasActions && (
                <div className="flex justify-end gap-4 mt-3 pt-3 border-t border-border">
                  {onEdit && <button onClick={() => onEdit(row)} className="text-brand text-sm font-medium">Edit</button>}
                  {onDelete && <button onClick={() => onDelete(row)} className="text-red-600 dark:text-red-400 text-sm font-medium">Delete</button>}
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {!loading && !error && pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-fg-muted">
          <span>{total} records</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage?.(page - 1)}>
              Prev
            </Button>
            <span className="px-2 py-1.5">
              {page} / {pages}
            </span>
            <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage?.(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
