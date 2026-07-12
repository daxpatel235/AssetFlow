'use client';
import { useState } from 'react';
import {
  Wrench, Plus, PlayCircle, AlertTriangle, CheckCircle2, XCircle, UserCog, Paperclip, MessageSquare, ImageIcon, Check,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, Field, Select, Textarea, EmptyState, FilterTabs } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Drawer, DetailRow } from '@/components/assetflow/ui';
import { MaintenanceStatusBadge, PriorityBadge, AssetStatusBadge } from '@/components/assetflow/badges';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { formatDate, formatCurrency } from '@/lib/format';
import {
  maintenance, assets, employees, asset as getAsset, employeeName,
  type MaintenanceStatus, type Priority,
} from '@/lib/mock/assetflow';

const STAGES: { key: MaintenanceStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'assigned', label: 'Technician' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];
const technicians = employees.filter((e) => e.title.toLowerCase().includes('technician'));

function Stepper({ status }: { status: MaintenanceStatus }) {
  if (status === 'rejected') {
    return <div className="flex items-center gap-2 text-sm text-red-500"><XCircle className="w-4 h-4" /> Request rejected — no work scheduled.</div>;
  }
  const idx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STAGES.map((s, i) => {
        const done = i < idx, current = i === idx;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold ${done ? 'bg-brand text-white' : current ? 'bg-brand/15 text-brand ring-2 ring-brand' : 'bg-surface-2 text-fg-muted'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`text-[11px] font-medium ${current ? 'text-fg' : 'text-fg-muted'}`}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < idx ? 'bg-brand' : 'bg-border'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function MaintenancePage() {
  const toast = useToast();
  const af = useAF();
  const canApprove = af.perms.approveMaintenance;
  const [filter, setFilter] = useState('all');
  const [prio, setPrio] = useState('');
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [tech, setTech] = useState('');
  const picked = maintenance.find((m) => m.id === pickedId) ?? null;

  const openCount = maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'rejected').length;
  const inProgress = maintenance.filter((m) => m.status === 'in_progress').length;
  const critical = maintenance.filter((m) => m.priority === 'critical' && m.status !== 'resolved').length;
  const resolved = maintenance.filter((m) => m.status === 'resolved').length;

  const filtered = maintenance.filter((m) => {
    if (filter === 'open' && (m.status === 'resolved' || m.status === 'rejected')) return false;
    if (filter !== 'all' && filter !== 'open' && m.status !== filter) return false;
    if (prio && m.priority !== prio) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Route repairs through approval — approving flips the asset to Under Maintenance, resolving returns it to service">
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Raise Request</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Requests" value={openCount} icon={Wrench} tone="amber" />
        <StatCard label="In Progress" value={inProgress} icon={PlayCircle} tone="blue" />
        <StatCard label="Critical" value={critical} icon={AlertTriangle} tone="red" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="green" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <FilterTabs tabs={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }]} active={filter} onChange={setFilter} />
        <Select value={prio} onChange={(e) => setPrio(e.target.value)} options={['low', 'medium', 'high', 'critical']} placeholder="All priorities" className="w-auto min-w-[10rem]" />
      </div>

      <div className="grid gap-3">
        {filtered.map((m) => {
          const as = getAsset(m.assetId);
          return (
            <Card key={m.id} className="hover:border-brand/40 transition">
              <button onClick={() => { setPickedId(m.id); setTech(m.technicianId ?? ''); }} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"><Wrench className="w-5 h-5" /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-brand">{as?.tag}</span>
                        <span className="font-semibold text-fg truncate">{as?.name}</span>
                      </div>
                      <p className="text-sm text-fg-muted line-clamp-1 mt-0.5">{m.issue}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-fg-muted">
                        <Avatar name={employeeName(m.raisedById)} size="sm" /> {employeeName(m.raisedById)} · {formatDate(m.createdAt)}
                        {m.technicianId && <><span>·</span><UserCog className="w-3.5 h-3.5" /> {employeeName(m.technicianId)}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <PriorityBadge priority={m.priority} />
                    <MaintenanceStatusBadge status={m.status} />
                  </div>
                </div>
              </button>
            </Card>
          );
        })}
        {!filtered.length && <EmptyState icon={Wrench} title="No requests match" />}
      </div>

      {/* Raise request modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Raise Maintenance Request" width="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const assetId = String(fd.get('assetId') || '');
          const issue = String(fd.get('issue') || '').trim();
          const priority = (String(fd.get('priority') || 'medium') || 'medium') as Priority;
          if (!assetId || !issue) { toast.error('Pick an asset and describe the issue'); return; }
          af.raiseMaintenance({ assetId, issue, priority });
          setOpen(false);
          toast.success('Maintenance request submitted for approval');
        }}>
          <Field label="Asset"><Select name="assetId" options={assets.map((a) => ({ value: a.id, label: `${a.tag} · ${a.name}` }))} placeholder="Select asset" /></Field>
          <Field label="Describe the issue"><Textarea name="issue" placeholder="What's wrong? Include symptoms and when it started." required /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Priority"><Select name="priority" options={['low', 'medium', 'high', 'critical']} placeholder="Select priority" /></Field>
            <Field label="Photo"><label className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-fg-muted cursor-pointer hover:border-brand/40"><ImageIcon className="w-4 h-4" /> Attach photo</label></Field>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit"><Wrench className="w-4 h-4" /> Submit request</Button></div>
        </form>
      </Modal>

      {/* Details drawer */}
      <Drawer open={!!picked} onClose={() => setPickedId(null)} title={picked ? getAsset(picked.assetId)?.name : ''} subtitle={picked ? getAsset(picked.assetId)?.tag : ''} width="max-w-xl"
        footer={picked && canApprove && (
          <div className="flex flex-wrap gap-2 justify-end">
            {picked.status === 'pending' && <>
              <Button variant="ghost" size="sm" onClick={() => { af.decideMaintenance(picked.id, false); toast.info('Request rejected'); }}><XCircle className="w-4 h-4" /> Reject</Button>
              <Button size="sm" onClick={() => { af.decideMaintenance(picked.id, true); toast.success('Approved · asset set to Under Maintenance'); }}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
            </>}
            {picked.status === 'approved' && <Button size="sm" onClick={() => { if (!tech) { toast.error('Select a technician first'); return; } af.assignTechnician(picked.id, tech); toast.success(`Assigned to ${employeeName(tech)}`); }}><UserCog className="w-4 h-4" /> Assign technician</Button>}
            {picked.status === 'assigned' && <Button size="sm" onClick={() => { af.startMaintenance(picked.id); toast.success('Work started'); }}><PlayCircle className="w-4 h-4" /> Start work</Button>}
            {picked.status === 'in_progress' && <Button size="sm" onClick={() => { af.resolveMaintenance(picked.id); toast.success('Resolved · asset back in service'); }}><CheckCircle2 className="w-4 h-4" /> Mark resolved</Button>}
          </div>
        )}
      >
        {picked && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap"><PriorityBadge priority={picked.priority} /><MaintenanceStatusBadge status={picked.status} /><span className="text-xs text-fg-muted flex items-center gap-1">asset now <AssetStatusBadge status={getAsset(picked.assetId)?.status ?? 'available'} /></span></div>
            <div className="rounded-xl border border-border p-4"><Stepper status={picked.status} /></div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Issue</p>
              <p className="text-sm text-fg">{picked.issue}</p>
            </div>

            <div className="rounded-xl border border-border p-4">
              <DetailRow label="Raised by">{employeeName(picked.raisedById)}</DetailRow>
              <DetailRow label="Reported">{formatDate(picked.createdAt)}</DetailRow>
              <DetailRow label="Technician">{picked.technicianId ? employeeName(picked.technicianId) : 'Unassigned'}</DetailRow>
              {picked.cost != null && <DetailRow label="Repair cost">{formatCurrency(picked.cost)}</DetailRow>}
            </div>

            {!canApprove && picked.status === 'pending' && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-fg-muted"><AlertTriangle className="w-4 h-4 text-amber-500" /> Awaiting an Asset Manager’s approval.</div>
            )}

            {canApprove && picked.status === 'approved' && (
              <Field label="Assign technician"><Select value={tech} onChange={(e) => setTech(e.target.value)} options={technicians.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select technician" /></Field>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-fg-muted" /><p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Activity & comments</p></div>
              <ul className="space-y-3">
                {picked.notes.map((n, i) => (
                  <li key={i} className="flex gap-3">
                    <Avatar name={employeeName(n.byId)} size="sm" />
                    <div className="flex-1 rounded-lg bg-surface-2/50 border border-border px-3 py-2">
                      <div className="flex items-center justify-between"><span className="text-sm font-medium text-fg">{employeeName(n.byId)}</span><span className="text-xs text-fg-muted">{formatDate(n.at)}</span></div>
                      <p className="text-sm text-fg-muted mt-0.5">{n.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2"><Paperclip className="w-4 h-4 text-fg-muted" /><p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Attachments</p></div>
              <div className="flex gap-2">
                {['before.jpg', 'part.jpg'].map((f) => (
                  <div key={f} className="w-20 h-20 rounded-lg border border-border bg-surface-2 grid place-items-center text-fg-muted"><ImageIcon className="w-6 h-6" /></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
