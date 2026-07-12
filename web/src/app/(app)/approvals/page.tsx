'use client';
import { useState } from 'react';
import { Inbox, ArrowLeftRight, Wrench, Check, X, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader, Card, Button, Avatar, EmptyState } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { Tabs } from '@/components/assetflow/ui';
import { PriorityBadge } from '@/components/assetflow/badges';
import { RoleGate } from '@/components/assetflow/RoleGate';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { timeAgo } from '@/lib/format';
import { transfers, maintenance, asset as getAsset, employeeName, type Transfer, type MaintenanceRequest } from '@/lib/mock/assetflow';

export default function ApprovalsPage() {
  const { perms } = useAF();
  return (
    <RoleGate allowed={perms.viewApprovals} title="Approvals — managers only">
      <ApprovalsInner />
    </RoleGate>
  );
}

function ApprovalsInner() {
  const toast = useToast();
  const af = useAF();
  const [processed, setProcessed] = useState(0);
  const [tab, setTab] = useState('all');

  const pendingTransfers = transfers.filter((t) => t.status === 'requested');
  const pendingMaint = maintenance.filter((m) => m.status === 'pending');

  const decideTransfer = (t: Transfer, ok: boolean) => {
    af.decideTransfer(t.id, ok);
    setProcessed((n) => n + 1);
    const label = getAsset(t.assetId)?.name ?? 'Asset';
    if (ok) toast.success(`Transfer approved · ${label} → ${employeeName(t.toId)}`);
    else toast.info(`Transfer rejected · ${label}`);
  };
  const decideMaint = (m: MaintenanceRequest, ok: boolean) => {
    af.decideMaintenance(m.id, ok);
    setProcessed((n) => n + 1);
    const label = getAsset(m.assetId)?.name ?? 'Asset';
    if (ok) toast.success(`Maintenance approved · ${label} → Under Maintenance`);
    else toast.info(`Maintenance request rejected · ${label}`);
  };

  const total = pendingTransfers.length + pendingMaint.length;
  const showT = tab === 'all' || tab === 'transfers';
  const showM = tab === 'all' || tab === 'maintenance';

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Everything waiting on a decision — approving a transfer moves the holder; approving maintenance flips the asset to Under Maintenance" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger">
        <StatCard label="Pending transfers" value={pendingTransfers.length} icon={ArrowLeftRight} tone="purple" hint="awaiting approval" />
        <StatCard label="Pending maintenance" value={pendingMaint.length} icon={Wrench} tone="amber" hint="awaiting approval" />
        <StatCard label="Processed this session" value={processed} icon={CheckCircle2} tone="green" hint="approved or rejected" />
      </div>

      <Tabs className="mb-6" active={tab} onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', count: total },
          { value: 'transfers', label: 'Transfers', count: pendingTransfers.length },
          { value: 'maintenance', label: 'Maintenance', count: pendingMaint.length },
        ]}
      />

      {total === 0 ? (
        <Card><EmptyState icon={CheckCircle2} title="All caught up" hint="There’s nothing waiting on your approval right now." /></Card>
      ) : (
        <div className="space-y-3">
          {/* Transfers */}
          {showT && pendingTransfers.map((t) => {
            const a = getAsset(t.assetId);
            return (
              <Card key={t.id} className="flex flex-col lg:flex-row lg:items-center gap-4">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0"><ArrowLeftRight className="w-5 h-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-fg">{a?.name}</p>
                    <span className="font-mono text-xs text-fg-muted">{a?.tag}</span>
                    <span className="rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 text-[11px] font-semibold">Transfer</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-fg-muted">
                    <Avatar name={employeeName(t.fromId)} size="sm" /><span className="text-fg font-medium">{employeeName(t.fromId)}</span>
                    <ArrowRight className="w-4 h-4" />
                    <Avatar name={employeeName(t.toId)} size="sm" /><span className="text-fg font-medium">{employeeName(t.toId)}</span>
                  </div>
                  <p className="text-sm text-fg-muted mt-2">{t.reason}</p>
                  <p className="text-[11px] text-fg-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> requested {timeAgo(t.requestedAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => decideTransfer(t, false)}><X className="w-4 h-4" /> Reject</Button>
                  <Button size="sm" onClick={() => decideTransfer(t, true)}><Check className="w-4 h-4" /> Approve</Button>
                </div>
              </Card>
            );
          })}

          {/* Maintenance */}
          {showM && pendingMaint.map((m) => {
            const a = getAsset(m.assetId);
            return (
              <Card key={m.id} className="flex flex-col lg:flex-row lg:items-center gap-4">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"><Wrench className="w-5 h-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-fg">{a?.name}</p>
                    <span className="font-mono text-xs text-fg-muted">{a?.tag}</span>
                    <PriorityBadge priority={m.priority} />
                  </div>
                  <p className="text-sm text-fg-muted mt-1.5">{m.issue}</p>
                  <p className="text-[11px] text-fg-muted mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> raised by {employeeName(m.raisedById)} · {timeAgo(m.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => decideMaint(m, false)}><X className="w-4 h-4" /> Reject</Button>
                  <Button size="sm" onClick={() => decideMaint(m, true)}><Check className="w-4 h-4" /> Approve</Button>
                </div>
              </Card>
            );
          })}

          {/* per-tab empties */}
          {tab === 'transfers' && pendingTransfers.length === 0 && <Card><EmptyState icon={Inbox} title="No pending transfers" /></Card>}
          {tab === 'maintenance' && pendingMaint.length === 0 && <Card><EmptyState icon={Inbox} title="No pending maintenance" /></Card>}
        </div>
      )}
    </div>
  );
}
