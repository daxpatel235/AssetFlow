'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, ArrowLeftRight, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Hourglass, CircleDot, Undo2, Building2, User,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, Field, Input, Select, Textarea, EmptyState } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Drawer, Tabs, DetailRow, Segmented } from '@/components/assetflow/ui';
import { Timeline, type TimelineItem } from '@/components/ui/Timeline';
import { AllocationStatusBadge, TransferStatusBadge, AssetStatusBadge } from '@/components/assetflow/badges';
import { RoleGate } from '@/components/assetflow/RoleGate';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { formatDate } from '@/lib/format';
import {
  allocations, transfers, assets, employees, departments,
  asset as getAsset, employeeName, departmentName, type Allocation, type Transfer, type Condition,
} from '@/lib/mock/assetflow';

export default function AllocationsPage() {
  const { perms } = useAF();
  return (
    <RoleGate allowed={perms.viewAllocations} title="Allocation & Transfer — managers only">
      <AllocationsInner />
    </RoleGate>
  );
}

function AllocationsInner() {
  const toast = useToast();
  const af = useAF();
  const [tab, setTab] = useState('active');

  // allocate modal state
  const [allocOpen, setAllocOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [target, setTarget] = useState<'employee' | 'department'>('employee');
  const [empId, setEmpId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [expReturn, setExpReturn] = useState('');
  const [cond, setCond] = useState<Condition>('good');
  const [note, setNote] = useState('');

  const [returnFor, setReturnFor] = useState<Allocation | null>(null);
  const [retCond, setRetCond] = useState<Condition>('good');
  const [retNote, setRetNote] = useState('');

  const [transferFor, setTransferFor] = useState<Allocation | null>(null);
  const [drawerTransfer, setDrawerTransfer] = useState<Transfer | null>(null);

  const active = allocations.filter((a) => a.status !== 'returned');
  const history = allocations.filter((a) => a.status === 'returned');
  const pendingCount = transfers.filter((t) => t.status === 'requested').length;

  const selectedAsset = assetId ? getAsset(assetId) : undefined;
  const conflict = selectedAsset && selectedAsset.status !== 'available';

  const resetAlloc = () => { setAssetId(''); setTarget('employee'); setEmpId(''); setDeptId(''); setExpReturn(''); setCond('good'); setNote(''); };

  function submitAllocate() {
    if (!assetId || conflict) return;
    if (target === 'employee' && !empId) { toast.error('Select an employee'); return; }
    if (target === 'department' && !deptId) { toast.error('Select a department'); return; }
    af.allocate({ assetId, targetType: target, employeeId: empId || undefined, departmentId: deptId || undefined, expectedReturn: expReturn || null, condition: cond, note });
    toast.success(target === 'employee' ? `Allocated to ${employeeName(empId)}` : `Allocated to ${departmentName(deptId)}`);
    setAllocOpen(false);
    resetAlloc();
  }

  function submitReturn() {
    if (!returnFor) return;
    af.returnAllocation(returnFor.id, { condition: retCond, note: retNote });
    toast.success('Asset returned — now Available');
    setReturnFor(null);
    setRetNote('');
  }

  function decideTransfer(t: Transfer, approve: boolean) {
    af.decideTransfer(t.id, approve);
    setDrawerTransfer(null);
    if (approve) toast.success('Transfer approved — holder updated'); else toast.info('Transfer rejected');
  }

  return (
    <div>
      <PageHeader title="Allocation & Transfer" subtitle="Who holds what — allocate to an employee or a department, with conflict handling and approvals">
        {af.perms.allocate && <Button onClick={() => { resetAlloc(); setAllocOpen(true); }}><UserPlus className="w-4 h-4" /> Allocate Asset</Button>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Allocations" value={active.filter((a) => a.status === 'active').length} icon={CircleDot} tone="blue" />
        <StatCard label="Overdue" value={active.filter((a) => a.status === 'overdue').length} icon={AlertTriangle} tone="red" />
        <StatCard label="Pending Transfers" value={pendingCount} icon={ArrowLeftRight} tone="amber" />
        <StatCard label="Returned" value={history.length} icon={RotateCcw} tone="green" />
      </div>

      <Tabs
        className="mb-5"
        tabs={[{ value: 'active', label: 'Active Allocations', count: active.length }, { value: 'transfers', label: 'Transfer Requests', count: transfers.length }, { value: 'history', label: 'Returned', count: history.length }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'active' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-fg-muted">
                <tr>{['Asset', 'Holder', 'Allocated', 'Expected return', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {active.map((a) => {
                  const as = getAsset(a.assetId);
                  return (
                    <tr key={a.id} className="border-t border-border hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <Link href={`/assets/${a.assetId}`} className="flex items-center gap-2 group min-w-0">
                          <span className="font-mono text-xs text-brand">{as?.tag}</span>
                          <span className="font-medium text-fg group-hover:text-brand truncate">{as?.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {a.departmentId
                          ? <span className="flex items-center gap-2"><span className="grid place-items-center w-8 h-8 rounded-lg bg-brand/10 text-brand"><Building2 className="w-4 h-4" /></span>{departmentName(a.departmentId)} <span className="text-xs text-fg-muted">(dept)</span></span>
                          : <span className="flex items-center gap-2"><Avatar name={employeeName(a.employeeId)} size="sm" />{employeeName(a.employeeId)}</span>}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{formatDate(a.allocatedAt)}</td>
                      <td className="px-4 py-3 text-fg-muted">{a.expectedReturn ? formatDate(a.expectedReturn) : '—'}</td>
                      <td className="px-4 py-3"><AllocationStatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {af.perms.allocate && <>
                          <button onClick={() => setTransferFor(a)} className="text-brand hover:underline mr-3">Transfer</button>
                          <button onClick={() => { setReturnFor(a); setRetCond('good'); setRetNote(''); }} className="text-fg-muted hover:text-fg hover:underline">Return</button>
                        </>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!active.length && <EmptyState title="No active allocations" />}
        </Card>
      )}

      {tab === 'transfers' && (
        <div className="grid gap-3">
          {transfers.map((t) => {
            const as = getAsset(t.assetId);
            return (
              <Card key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-brand">{as?.tag}</span>
                    <span className="font-semibold text-fg truncate">{as?.name}</span>
                    <TransferStatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="flex items-center gap-1.5"><Avatar name={employeeName(t.fromId)} size="sm" />{employeeName(t.fromId)}</span>
                    <ArrowLeftRight className="w-4 h-4" />
                    <span className="flex items-center gap-1.5"><Avatar name={employeeName(t.toId)} size="sm" />{employeeName(t.toId)}</span>
                  </div>
                  <p className="text-sm text-fg mt-2">{t.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setDrawerTransfer(t)}>Details</Button>
                  {t.status === 'requested' && af.perms.approveTransfers && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => decideTransfer(t, false)}><XCircle className="w-4 h-4" /> Reject</Button>
                      <Button size="sm" onClick={() => decideTransfer(t, true)}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'history' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-fg-muted"><tr>{['Asset', 'Holder', 'Returned', 'Check-in note'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-medium text-fg">{getAsset(a.assetId)?.name}</td>
                    <td className="px-4 py-3">{a.departmentId ? departmentName(a.departmentId) : employeeName(a.employeeId)}</td>
                    <td className="px-4 py-3 text-fg-muted">{a.returnedAt ? formatDate(a.returnedAt) : '—'}</td>
                    <td className="px-4 py-3 text-fg-muted">{a.checkinNote ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!history.length && <EmptyState title="No returns yet" />}
        </Card>
      )}

      {/* ── Allocate modal (employee OR department, with conflict rule) ── */}
      <Modal open={allocOpen} onClose={() => setAllocOpen(false)} title="Allocate Asset" width="max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); submitAllocate(); }}>
          <Field label="Asset">
            <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} options={assets.map((a) => ({ value: a.id, label: `${a.tag} · ${a.name}` }))} placeholder="Select an asset" />
          </Field>
          {conflict && selectedAsset && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-fg">Can&apos;t allocate — asset is {selectedAsset.status}</p>
                <p className="text-fg-muted">{selectedAsset.holderId ? <>Currently held by <span className="font-medium text-fg">{employeeName(selectedAsset.holderId)}</span>. Request a transfer instead.</> : 'Resolve its status first.'}</p>
              </div>
            </div>
          )}
          <Field label="Allocate to">
            <Segmented options={[{ value: 'employee', label: 'Employee', icon: User }, { value: 'department', label: 'Department', icon: Building2 }]} value={target} onChange={setTarget} />
          </Field>
          {target === 'employee' ? (
            <Field label="Assign to employee"><Select value={empId} onChange={(e) => setEmpId(e.target.value)} options={employees.filter((e) => e.status === 'active').map((e) => ({ value: e.id, label: e.name }))} placeholder="Select employee" disabled={!!conflict} /></Field>
          ) : (
            <Field label="Assign to department" hint="Shared custody — the department head is recorded as responsible."><Select value={deptId} onChange={(e) => setDeptId(e.target.value)} options={departments.filter((d) => d.status === 'active').map((d) => ({ value: d.id, label: d.name }))} placeholder="Select department" disabled={!!conflict} /></Field>
          )}
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Expected return date"><Input type="date" value={expReturn} onChange={(e) => setExpReturn(e.target.value)} disabled={!!conflict} /></Field>
            <Field label="Condition at checkout"><Select value={cond} onChange={(e) => setCond(e.target.value as Condition)} options={['new', 'good', 'fair', 'poor']} placeholder="Condition" disabled={!!conflict} /></Field>
          </div>
          <Field label="Checkout note"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Purpose, accessories, etc." disabled={!!conflict} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAllocOpen(false)}>Cancel</Button>
            {conflict ? (
              <Button type="button" onClick={() => { setAllocOpen(false); if (selectedAsset?.holderId) { setTransferFor(active.find((a) => a.assetId === assetId) ?? null); } else { toast.info('Resolve the asset first'); } }}><ArrowLeftRight className="w-4 h-4" /> Request Transfer</Button>
            ) : (
              <Button type="submit" disabled={!assetId}><UserPlus className="w-4 h-4" /> Allocate</Button>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Transfer request modal ── */}
      <Modal open={!!transferFor} onClose={() => setTransferFor(null)} title="Request Transfer" width="max-w-lg">
        {transferFor && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const toId = String(fd.get('toId') || '');
            const reason = String(fd.get('reason') || '').trim();
            if (!toId || !reason) { toast.error('Pick a recipient and a reason'); return; }
            af.requestTransfer({ assetId: transferFor.assetId, fromId: transferFor.employeeId, toId, reason });
            setTransferFor(null); setTab('transfers'); toast.success('Transfer requested');
          }}>
            <div className="mb-4 rounded-lg bg-surface-2/60 border border-border p-3 text-sm">
              <p className="font-semibold text-fg">{getAsset(transferFor.assetId)?.name}</p>
              <p className="text-fg-muted">Currently with {employeeName(transferFor.employeeId)}</p>
            </div>
            <Field label="Transfer to"><Select name="toId" options={employees.filter((e) => e.id !== transferFor.employeeId && e.status === 'active').map((e) => ({ value: e.id, label: e.name }))} placeholder="Select new holder" /></Field>
            <Field label="Reason"><Textarea name="reason" placeholder="Why is this transfer needed?" required /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setTransferFor(null)}>Cancel</Button><Button type="submit"><ArrowLeftRight className="w-4 h-4" /> Submit request</Button></div>
          </form>
        )}
      </Modal>

      {/* ── Return modal ── */}
      <Modal open={!!returnFor} onClose={() => setReturnFor(null)} title="Return Asset" width="max-w-lg">
        {returnFor && (
          <form onSubmit={(e) => { e.preventDefault(); submitReturn(); }}>
            <div className="mb-4 rounded-lg bg-surface-2/60 border border-border p-3 text-sm">
              <p className="font-semibold text-fg">{getAsset(returnFor.assetId)?.name}</p>
              <p className="text-fg-muted">Held by {returnFor.departmentId ? departmentName(returnFor.departmentId) : employeeName(returnFor.employeeId)}</p>
            </div>
            <Field label="Condition on return"><Select value={retCond} onChange={(e) => setRetCond(e.target.value as Condition)} options={['new', 'good', 'fair', 'poor']} placeholder="Assess condition" /></Field>
            <Field label="Check-in notes"><Textarea value={retNote} onChange={(e) => setRetNote(e.target.value)} placeholder="Any damage, missing accessories, etc." /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setReturnFor(null)}>Cancel</Button><Button type="submit"><Undo2 className="w-4 h-4" /> Confirm return</Button></div>
          </form>
        )}
      </Modal>

      {/* ── Transfer approval drawer ── */}
      <Drawer open={!!drawerTransfer} onClose={() => setDrawerTransfer(null)} title={drawerTransfer ? getAsset(drawerTransfer.assetId)?.name : ''} subtitle="Transfer request">
        {drawerTransfer && (() => {
          const items: TimelineItem[] = [
            { title: 'Requested', description: `by ${employeeName(drawerTransfer.fromId)}`, time: drawerTransfer.requestedAt, icon: Hourglass, tone: 'brand' },
            ...(drawerTransfer.status === 'approved' || drawerTransfer.status === 'completed' ? [{ title: 'Approved', description: `by ${employeeName(drawerTransfer.approverId)}`, time: drawerTransfer.requestedAt, icon: CheckCircle2, tone: 'green' as const }] : []),
            ...(drawerTransfer.status === 'rejected' ? [{ title: 'Rejected', description: `by ${employeeName(drawerTransfer.approverId)}`, time: drawerTransfer.requestedAt, icon: XCircle, tone: 'red' as const }] : []),
          ];
          return (
            <div className="space-y-6">
              <div><AssetStatusBadge status={getAsset(drawerTransfer.assetId)?.status ?? 'available'} /></div>
              <div className="rounded-xl border border-border p-4">
                <DetailRow label="From">{employeeName(drawerTransfer.fromId)}</DetailRow>
                <DetailRow label="To">{employeeName(drawerTransfer.toId)}</DetailRow>
                <DetailRow label="Status"><TransferStatusBadge status={drawerTransfer.status} /></DetailRow>
                <DetailRow label="Reason"><span className="text-left">{drawerTransfer.reason}</span></DetailRow>
              </div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">Approval timeline</p><Timeline items={items} /></div>
              {drawerTransfer.status === 'requested' && af.perms.approveTransfers && (
                <div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => decideTransfer(drawerTransfer, false)}><XCircle className="w-4 h-4" /> Reject</Button><Button className="flex-1" onClick={() => decideTransfer(drawerTransfer, true)}><CheckCircle2 className="w-4 h-4" /> Approve</Button></div>
              )}
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
