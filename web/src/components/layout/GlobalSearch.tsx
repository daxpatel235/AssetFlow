'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft, Boxes, Users, Building2, CalendarDays, type LucideIcon } from 'lucide-react';
import {
  assets, employees, departments, bookings,
  categoryName, departmentName, employeeName, asset as getAsset,
} from '@/lib/mock/assetflow';

type Hit = { id: string; title: string; subtitle: string; href: string };
type Group = { label: string; icon: LucideIcon; hits: Hit[] };

// ⌘K / Ctrl-K palette — searches the AssetFlow domain (assets, people,
// departments, bookings) entirely client-side over the mock layer.
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ('');
  }, [open]);

  const groups = useMemo<Group[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const g: Group[] = [
      {
        label: 'Assets', icon: Boxes,
        hits: assets
          .filter((a) => `${a.name} ${a.tag} ${a.serial} ${a.location}`.toLowerCase().includes(s))
          .slice(0, 6)
          .map((a) => ({ id: a.id, title: a.name, subtitle: `${a.tag} · ${categoryName(a.categoryId)}`, href: `/assets/${a.id}` })),
      },
      {
        label: 'People', icon: Users,
        hits: employees
          .filter((e) => `${e.name} ${e.email} ${e.title}`.toLowerCase().includes(s))
          .slice(0, 5)
          .map((e) => ({ id: e.id, title: e.name, subtitle: `${e.title} · ${departmentName(e.departmentId)}`, href: '/organization' })),
      },
      {
        label: 'Departments', icon: Building2,
        hits: departments
          .filter((d) => `${d.name} ${d.code}`.toLowerCase().includes(s))
          .slice(0, 4)
          .map((d) => ({ id: d.id, title: d.name, subtitle: `${d.code} · ${d.employeeCount} people`, href: '/organization' })),
      },
      {
        label: 'Bookings', icon: CalendarDays,
        hits: bookings
          .filter((b) => `${b.purpose} ${getAsset(b.resourceId)?.name ?? ''} ${employeeName(b.employeeId)}`.toLowerCase().includes(s))
          .slice(0, 4)
          .map((b) => ({ id: b.id, title: b.purpose, subtitle: `${getAsset(b.resourceId)?.name ?? ''} · ${employeeName(b.employeeId)}`, href: '/bookings' })),
      },
    ];
    return g.filter((x) => x.hits.length);
  }, [q]);

  const flat = groups.flatMap((g) => g.hits);
  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-fg-muted text-sm hover:border-brand/40 transition w-full sm:w-64"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search assets, people…</span>
        <kbd className="hidden sm:inline text-[10px] border border-border rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-pop overflow-hidden animate-scale-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-fg-muted shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && flat[0]) go(flat[0].href); }}
                placeholder="Search assets, people, departments, bookings…"
                className="flex-1 min-w-0 bg-transparent text-fg outline-none text-sm placeholder:text-fg-muted"
              />
              <button onClick={() => setOpen(false)} className="shrink-0 p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition" aria-label="Close search"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {q.trim() && groups.length === 0 && <p className="text-sm text-fg-muted text-center py-10">No matches for “{q}”</p>}
              {groups.map((group) => {
                const GIcon = group.icon;
                return (
                  <div key={group.label} className="py-1">
                    <p className="px-4 py-1 text-[11px] font-semibold text-fg-muted uppercase tracking-wider">{group.label}</p>
                    {group.hits.map((hit) => (
                      <button key={hit.id} onClick={() => go(hit.href)} className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3 group">
                        <span className="grid place-items-center w-8 h-8 rounded-lg bg-surface-2 text-fg-muted shrink-0"><GIcon className="w-4 h-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-fg truncate">{hit.title}</span>
                          <span className="block text-xs text-fg-muted truncate">{hit.subtitle}</span>
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-fg-muted opacity-0 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                );
              })}
              {!q.trim() && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-fg-muted">Search across assets, people, departments &amp; bookings</p>
                  <p className="text-xs text-fg-muted mt-1">Try “macbook”, “Priya”, or “engineering”</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
