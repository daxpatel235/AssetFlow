'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Table as TableIcon, Plus, MapPin, QrCode, PackageSearch, ImagePlus } from 'lucide-react';
import { PageHeader, Button, SearchBar, Select, Avatar, EmptyState, Field, Input, Checkbox } from '@/components/ui/kit';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Segmented } from '@/components/assetflow/ui';
import { AssetStatusBadge, ConditionBadge, categoryIcon, ASSET_STATUS_TABS } from '@/components/assetflow/badges';
import { FilterTabs } from '@/components/ui/kit';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { exportToCSV } from '@/lib/export';
import { formatCurrency } from '@/lib/format';
import { assets, categories, departments, categoryName, departmentName, employeeName, category as getCategory, type Asset, type Condition } from '@/lib/mock/assetflow';

export default function AssetsPage() {
  const toast = useToast();
  const af = useAF();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('');
  const [dept, setDept] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [sort, setSort] = useState('tag');
  const [openNew, setOpenNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newAssetCat, setNewAssetCat] = useState('');
  const activeCatFields = getCategory(newAssetCat)?.fields || [];
  const clearFilters = () => { setQ(''); setStatus('all'); setCat(''); setDept(''); };
  const nextTag = `AF-${String(assets.length + 1).padStart(4, '0')}`;

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error('CSV must have a header row and data');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const nameIdx = headers.indexOf('name');
          const catIdx = headers.findIndex(h => h.includes('category'));
          if (nameIdx === -1) continue;
          
          const name = vals[nameIdx];
          if (!name) continue;
          
          let catId = categories[0].id;
          if (catIdx !== -1 && vals[catIdx]) {
            const foundCat = categories.find(c => c.name.toLowerCase() === vals[catIdx].toLowerCase());
            if (foundCat) catId = foundCat.id;
          }
          
          af.registerAsset({ name, categoryId: catId });
          imported++;
        }
        toast.success(`Imported ${imported} assets from CSV`);
      } catch (err: any) {
        toast.error('Failed to parse CSV: ' + err.message);
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const rows = useMemo(() => {
    let r = assets.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (cat && a.categoryId !== cat) return false;
      if (dept && a.departmentId !== dept) return false;
      if (q) {
        const s = q.toLowerCase();
        return a.name.toLowerCase().includes(s) || a.tag.toLowerCase().includes(s) || a.serial.toLowerCase().includes(s) || a.location.toLowerCase().includes(s) || departmentName(a.departmentId).toLowerCase().includes(s);
      }
      return true;
    });
    const desc = sort.startsWith('-');
    const key = (desc ? sort.slice(1) : sort) as keyof Asset;
    r = [...r].sort((a, b) => {
      const av = a[key] as string | number, bv = b[key] as string | number;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return desc ? -cmp : cmp;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, cat, dept, sort, af.v]);

  const columns: Column<Asset>[] = [
    { key: 'tag', label: 'Tag', sortable: true, render: (a) => <Link href={`/assets/${a.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">{a.tag}</Link> },
    { key: 'name', label: 'Asset', sortable: true, render: (a) => (
      <Link href={`/assets/${a.id}`} className="flex items-center gap-3 group">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-surface-2 text-fg-muted shrink-0">{(() => { const I = categoryIcon(getCategory(a.categoryId)?.icon ?? ''); return <I className="w-4 h-4" />; })()}</span>
        <span className="min-w-0">
          <span className="block font-medium text-fg group-hover:text-brand truncate">{a.name}</span>
          <span className="block text-xs text-fg-muted truncate">{a.serial}</span>
        </span>
      </Link>
    ) },
    { key: 'categoryId', label: 'Category', render: (a) => categoryName(a.categoryId), exportValue: (a) => categoryName(a.categoryId) },
    { key: 'status', label: 'Status', render: (a) => <AssetStatusBadge status={a.status} />, exportValue: (a) => a.status },
    { key: 'condition', label: 'Condition', render: (a) => <ConditionBadge condition={a.condition} />, exportValue: (a) => a.condition },
    { key: 'location', label: 'Location', render: (a) => <span className="text-fg-muted">{a.location}</span> },
    { key: 'holderId', label: 'Holder', render: (a) => a.holderId ? <span className="flex items-center gap-2"><Avatar name={employeeName(a.holderId)} size="sm" /><span className="text-sm">{employeeName(a.holderId)}</span></span> : <span className="text-fg-muted">—</span>, exportValue: (a) => employeeName(a.holderId) },
    { key: 'acquisitionCost', label: 'Cost', align: 'right', sortable: true, render: (a) => <span className="font-medium tabular-nums">{formatCurrency(a.acquisitionCost)}</span>, exportValue: (a) => a.acquisitionCost },
  ];

  return (
    <div>
      <PageHeader title="Asset Registry" subtitle={`${assets.length} assets across ${categories.length} categories`}>
        <Segmented options={[{ value: 'table', label: 'Table', icon: TableIcon }, { value: 'grid', label: 'Grid', icon: LayoutGrid }]} value={view} onChange={setView} />
        {af.perms.registerAsset && (
          <div className="flex items-center gap-2">

            <input type="file" id="csv-import" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={importing} />
            <Button variant="ghost" disabled={importing} onClick={() => document.getElementById('csv-import')?.click()}>
              {importing ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button onClick={() => setOpenNew(true)}><Plus className="w-4 h-4" /> Register Asset</Button>
          </div>
        )}
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search tag, serial, name, location, department…" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="All categories" className="w-auto min-w-[10rem]" />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="All departments" className="w-auto min-w-[10rem]" />
      </div>
      <FilterTabs tabs={ASSET_STATUS_TABS} active={status} onChange={setStatus} className="mb-5" />

      {view === 'table' ? (
        <DataTable columns={columns} rows={rows} sort={sort} onSort={(key) => setSort((s) => (s === key ? `-${key}` : key))} exportName="assets" title="Asset Registry" total={rows.length} />
      ) : rows.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((a) => {
            const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
            return (
              <Link key={a.id} href={`/assets/${a.id}`} className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-brand/40 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ease-spring">
                <div className="relative h-28 bg-gradient-to-br from-brand-500/15 via-surface-2 to-violet-500/10 grid place-items-center overflow-hidden">
                  <Icon className="w-10 h-10 text-brand/70 transition-transform duration-300 ease-spring group-hover:scale-110" />
                  <span className="absolute top-2.5 left-2.5"><AssetStatusBadge status={a.status} /></span>
                  <span className="absolute top-2.5 right-2.5 grid place-items-center w-7 h-7 rounded-md bg-surface/80 backdrop-blur text-fg-muted"><QrCode className="w-4 h-4" /></span>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[11px] font-semibold text-brand">{a.tag}</p>
                  <p className="font-semibold text-fg truncate group-hover:text-brand">{a.name}</p>
                  <p className="text-xs text-fg-muted mt-0.5">{categoryName(a.categoryId)}</p>
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted mt-3">
                    <MapPin className="w-3.5 h-3.5" /> {a.location}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    {a.holderId ? (
                      <span className="flex items-center gap-1.5 min-w-0"><Avatar name={employeeName(a.holderId)} size="sm" /><span className="text-xs text-fg truncate">{employeeName(a.holderId)}</span></span>
                    ) : (
                      <span className="text-xs text-fg-muted">Unassigned</span>
                    )}
                    <span className="text-sm font-semibold text-fg tabular-nums">{formatCurrency(a.acquisitionCost)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={PackageSearch} title="No assets match" hint="No assets match your current search or filters." action={<Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>} />
      )}

      {/* Register Asset modal */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Register New Asset" width="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get('name') || '').trim();
            const categoryId = String(fd.get('categoryId') || '');
            if (!name || !categoryId) { toast.error('Name and category are required'); return; }
            const customData: Record<string, any> = {};
            activeCatFields.forEach((f) => {
              const val = fd.get(`custom_${f.name}`);
              if (f.type === 'boolean') customData[f.name] = val === 'on';
              else if (f.type === 'number') customData[f.name] = Number(val) || 0;
              else customData[f.name] = String(val || '');
            });

            const tag = af.registerAsset({
              name, categoryId,
              serial: String(fd.get('serial') || '') || undefined,
              location: String(fd.get('location') || '') || undefined,
              acquisitionDate: String(fd.get('acquisitionDate') || '') || undefined,
              acquisitionCost: Number(fd.get('acquisitionCost') || 0),
              condition: (String(fd.get('condition') || 'new') || 'new') as Condition,
              departmentId: String(fd.get('departmentId') || '') || null,
              bookable: fd.get('bookable') === 'on',
              warrantyEnds: String(fd.get('warrantyEnds') || '') || undefined,
              customData,
            });
            setOpenNew(false);
            setNewAssetCat('');
            toast.success(`Asset ${tag} registered`);
          }}
        >
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand/5 border border-brand/20 px-3 py-2">
            <span className="text-xs text-fg-muted">Auto-generated tag</span>
            <span className="font-mono text-sm font-semibold text-brand">{nextTag}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Asset name"><Input name="name" placeholder="e.g. MacBook Pro 16&quot;" required /></Field>
            <Field label="Category"><Select name="categoryId" value={newAssetCat} onChange={(e) => setNewAssetCat(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select category" /></Field>
            <Field label="Serial number"><Input name="serial" placeholder="Serial / VIN" /></Field>
            <Field label="Location"><Input name="location" placeholder="e.g. HQ · Floor 3" /></Field>
            <Field label="Acquisition date"><Input name="acquisitionDate" type="date" /></Field>
            <Field label="Acquisition cost"><Input name="acquisitionCost" type="number" placeholder="0.00" /></Field>
            <Field label="Condition"><Select name="condition" options={['new', 'good', 'fair', 'poor']} placeholder="Select condition" /></Field>
            <Field label="Department"><Select name="departmentId" options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="Assign to department" /></Field>
            <Field label="Warranty expiry"><Input name="warrantyEnds" type="date" /></Field>
            {activeCatFields.map((f) => (
              <Field key={f.name} label={f.name}>
                {f.type === 'boolean' ? <Checkbox name={`custom_${f.name}`} label={`Yes, ${f.name.toLowerCase()}`} /> : <Input name={`custom_${f.name}`} type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} />}
              </Field>
            ))}
          </div>
          <Field label="Photo / documents"><label className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-fg-muted cursor-pointer hover:border-brand/40"><ImagePlus className="w-4 h-4" /> Drag files or click to attach a photo / receipt</label></Field>
          <Checkbox name="bookable" label="Shared / bookable resource" className="mb-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpenNew(false)}>Cancel</Button>
            <Button type="submit"><Plus className="w-4 h-4" /> Register Asset</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
