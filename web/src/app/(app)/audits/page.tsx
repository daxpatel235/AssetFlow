'use client';
import { useState } from 'react';
import {
  ClipboardCheck, Plus, ShieldCheck, ShieldAlert, Lock, Users, CalendarRange, FileWarning, MapPin,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, Field, Input, Select, Textarea } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/assetflow/ui';
import { AuditCycleBadge, AuditResultBadge } from '@/components/assetflow/badges';
import { RoleGate } from '@/components/assetflow/RoleGate';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { formatDate } from '@/lib/format';
import {
  auditCycles, assets, asset as getAsset, employeeName, departments, department as getDept,
  type AuditCycle, type AuditResult,
} from '@/lib/mock/assetflow';

const RESULTS: AuditResult[] = ['verified', 'missing', 'damaged'];
const RESULT_BTN: Record<'verified' | 'missing' | 'damaged', string> = {
  verified: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
  missing: 'bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-300',
  damaged: 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300',
};
const progressOf = (c: AuditCycle) => {
  const done = c.records.filter((r) => r.result !== 'pending').length;
  return { done, total: c.records.length, pct: c.records.length ? Math.round((done / c.records.length) * 100) : 0 };
};
const discrepanciesOf = (c: AuditCycle) => c.records.filter((r) => r.result === 'missing' || r.result === 'damaged');

export default function AuditsPage() {
  const { perms } = useAF();
  return (
    <RoleGate allowed={perms.manageAudits} title="Audit Cycles — Asset Managers & Admins">
      <AuditsInner />
    </RoleGate>
  );
}

function AuditsInner() {
  const toast = useToast();
  const af = useAF();
  const [openNew, setOpenNew] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = auditCycles.find((c) => c.id === pickedId) ?? null;

  const activeCount = auditCycles.filter((c) => c.status === 'active').length;
  const toVerify = auditCycles.filter((c) => c.status === 'active').reduce((n, c) => n + c.records.filter((r) => r.result === 'pending').length, 0);
  const discrepancies = auditCycles.reduce((n, c) => n + discrepanciesOf(c).length, 0);
  const closed = auditCycles.filter((c) => c.status === 'closed').length;

  function closeCycle(cycleId: string) {
    const missing = af.closeAudit(cycleId);
    toast.success(`Cycle closed · ${missing} asset(s) marked Lost`);
    setPickedId(null);
  }

  return (
    <div>
      <PageHeader title="Audit Cycles" subtitle="Structured verification cycles with auto-generated discrepancy reports — closing marks missing assets Lost">
        <Button onClick={() => setOpenNew(true)}><Plus className="w-4 h-4" /> New Audit Cycle</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Cycles" value={activeCount} icon={ClipboardCheck} tone="blue" />
        <StatCard label="Assets to Verify" value={toVerify} icon={ShieldCheck} tone="amber" />
        <StatCard label="Discrepancies" value={discrepancies} icon={ShieldAlert} tone="red" />
        <StatCard label="Closed Cycles" value={closed} icon={Lock} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {auditCycles.map((c) => {
          const p = progressOf(c);
          const disc = discrepanciesOf(c);
          return (
            <Card key={c.id} className="hover:border-brand/40 transition">
              <button onClick={() => setPickedId(c.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-fg truncate">{c.name}</p>
                    <p className="text-xs text-fg-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {c.scope}</p>
                  </div>
                  <AuditCycleBadge status={c.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-fg-muted mb-3">
                  <span className="flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> {formatDate(c.from)} – {formatDate(c.to)}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.auditorIds.length} auditor{c.auditorIds.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="text-fg-muted">Verification progress</span><span className="font-semibold text-fg">{p.done}/{p.total}</span></div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${p.pct}%` }} /></div>
                {disc.length > 0 && <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400"><FileWarning className="w-3.5 h-3.5" /> {disc.length} discrepancy{disc.length > 1 ? 'ies' : ''} flagged</p>}
              </button>
            </Card>
          );
        })}
      </div>

      {/* New cycle modal */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Create Audit Cycle" width="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get('name') || '').trim();
          const scopeVal = String(fd.get('scope') || '');
          const from = String(fd.get('from') || '') || '2026-07-12';
          const to = String(fd.get('to') || '') || '2026-07-26';
          if (!name) { toast.error('Name the cycle'); return; }
          const dept = getDept(scopeVal);
          const scope = dept ? dept.name : 'By location';
          const assetIds = dept ? assets.filter((a) => a.departmentId === dept.id).map((a) => a.id) : [];
          af.createAuditCycle({ name, scope, from, to, auditorIds: [af.actingId], assetIds });
          setOpenNew(false);
          toast.success(`Audit cycle created · ${assetIds.length} assets to verify`);
        }}>
          <Field label="Cycle name"><Input name="name" placeholder="e.g. Q3 HQ Floor 3 Audit" required /></Field>
          <Field label="Scope (department / location)" hint="Assets in the chosen department are added to the checklist."><Select name="scope" options={[...departments.map((d) => ({ value: d.id, label: d.name })), { value: 'loc', label: 'By location…' }]} placeholder="Select scope" /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="From"><Input name="from" type="date" /></Field>
            <Field label="To"><Input name="to" type="date" /></Field>
          </div>
          <Field label="Assign auditors"><Textarea placeholder="Add one or more auditors…" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpenNew(false)}>Cancel</Button><Button type="submit"><ClipboardCheck className="w-4 h-4" /> Create cycle</Button></div>
        </form>
      </Modal>

      {/* Verification drawer */}
      <Drawer open={!!picked} onClose={() => setPickedId(null)} title={picked?.name} subtitle={picked?.scope} width="max-w-2xl"
        footer={picked && picked.status !== 'closed' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-fg-muted">Closing locks the cycle and updates asset statuses (missing → Lost).</span>
            <Button size="sm" onClick={() => closeCycle(picked.id)}><Lock className="w-4 h-4" /> Close cycle</Button>
          </div>
        )}
      >
        {picked && (() => {
          const p = progressOf(picked);
          const disc = discrepanciesOf(picked);
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <AuditCycleBadge status={picked.status} />
                <span className="text-xs text-fg-muted flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> {formatDate(picked.from)} – {formatDate(picked.to)}</span>
              </div>

              {/* Auditors */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Auditors</p>
                <div className="flex flex-wrap gap-2">
                  {picked.auditorIds.length ? picked.auditorIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/50 pl-1 pr-3 py-1"><Avatar name={employeeName(id)} size="sm" /><span className="text-sm text-fg">{employeeName(id)}</span></span>
                  )) : <span className="text-sm text-fg-muted">No auditors assigned.</span>}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="mb-1 flex items-center justify-between text-sm"><span className="text-fg-muted">Progress</span><span className="font-semibold text-fg">{p.done}/{p.total} · {p.pct}%</span></div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-brand rounded-full transition-all" style={{ width: `${p.pct}%` }} /></div>
              </div>

              {/* Discrepancy report */}
              {disc.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/[0.03] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-fg mb-3"><FileWarning className="w-4 h-4 text-red-500" /> Auto-generated Discrepancy Report</p>
                  <ul className="space-y-2">
                    {disc.map((r) => (
                      <li key={r.assetId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-fg truncate">{getAsset(r.assetId)?.name} <span className="font-mono text-xs text-fg-muted">{getAsset(r.assetId)?.tag}</span></span>
                        <span className="flex items-center gap-2 shrink-0"><AuditResultBadge result={r.result} />{r.note && <span className="text-xs text-fg-muted hidden sm:inline">{r.note}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verification list */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">Asset verification</p>
                <div className="space-y-2">
                  {picked.records.length ? picked.records.map((r) => {
                    const a = getAsset(r.assetId);
                    return (
                      <div key={r.assetId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-3">
                        <div className="min-w-0"><p className="text-sm font-medium text-fg truncate">{a?.name}</p><p className="font-mono text-xs text-fg-muted">{a?.tag} · {a?.location}</p></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {picked.status === 'closed' ? <AuditResultBadge result={r.result} /> : RESULTS.map((res) => {
                            const on = r.result === res;
                            return (
                              <button key={res} onClick={() => af.setAuditResult(picked.id, r.assetId, res)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition border ${on ? RESULT_BTN[res as 'verified' | 'missing' | 'damaged'] : 'border-border text-fg-muted hover:text-fg hover:border-brand/40'}`}
                              >{res}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-fg-muted">No assets in scope for this cycle yet.</p>}
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
