'use client';
// ★ GOLD-STANDARD MODULE (typed). Copy this file, change resourcePath, COLUMNS,
// FIELDS. Search, sort, filter, pagination, export, toasts, confirm, and cache
// invalidation all come free and fully type-checked.
import { Badge } from '@/components/ui/kit';
import { CrudPage } from '@/components/ui/CrudPage';
import type { Column } from '@/components/ui/DataTable';
import type { FieldDef } from '@/components/ui/EntityForm';
import { formatCurrency } from '@/lib/format';
import type { Item } from '@/types';

const COLUMNS: Column<Item>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price', sortable: true, align: 'right', render: (r) => formatCurrency(r.price), exportValue: (r) => r.price },
  { key: 'quantity', label: 'Qty', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', filter: ['active', 'archived'], render: (r) => <Badge tone={r.status === 'active' ? 'green' : 'gray'}>{r.status}</Badge> },
];

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'sku', label: 'SKU', placeholder: 'e.g. A-001' },
  { name: 'price', label: 'Price', type: 'currency' },
  { name: 'quantity', label: 'Quantity', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] },
];

// Drag a card between columns to flip its status server-side — the "second view"
// of the same data (high visual impact, near-zero cost; see docs/WINNING.md).
const BOARD = {
  groupBy: 'status' as const,
  columns: [
    { key: 'active', label: 'Active', color: '#059669' },
    { key: 'archived', label: 'Archived', color: '#94a3b8' },
  ],
  renderCard: (r: Item) => (
    <div>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-fg">{r.name}</span>
        <Badge tone={r.quantity <= 5 ? (r.quantity === 0 ? 'red' : 'amber') : 'gray'}>{r.quantity}</Badge>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
        <span>{r.sku || '—'}</span>
        <span className="font-semibold text-fg">{formatCurrency(r.price)}</span>
      </div>
    </div>
  ),
};

export default function ItemsPage() {
  return (
    <CrudPage<Item>
      title="Items"
      subtitle="Example module — clone this file for real entities."
      singular="item"
      resourcePath="/items"
      columns={COLUMNS}
      fields={FIELDS}
      searchPlaceholder="Search items…"
      board={BOARD}
    />
  );
}
