'use client';
import { useState } from 'react';
import { ScanLine, QrCode, ArrowRight, Check, RotateCcw, AlertTriangle, Undo2, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, Field, Input, Select, Textarea, Avatar } from '@/components/ui/kit';
import { AssetStatusBadge, categoryIcon } from '@/components/assetflow/badges';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { assets, allocations, employees, employeeName, category as getCategory, type Asset, type Condition } from '@/lib/mock/assetflow';

const CONDITIONS = ['new', 'good', 'fair', 'poor'];

// Globally-reachable QR check-out / check-in flow. "Scan" a tag → the asset's
// current state decides whether you're checking it OUT (assign) or IN (return),
// capturing condition on both ends. Demo-only: confirms with a toast.
export function CheckInOut() {
  const toast = useToast();
  const af = useAF();
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [scanning, setScanning] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [ret, setRet] = useState('');
  const [cond, setCond] = useState<Condition>('good');
  const [note, setNote] = useState('');

  const mode: 'out' | 'in' | 'blocked' | null = !asset
    ? null
    : asset.holderId
      ? 'in'
      : asset.status === 'available' || asset.status === 'reserved'
        ? 'out'
        : 'blocked';

  const resetForm = () => { setAssignTo(''); setRet(''); setCond('good'); setNote(''); };
  const rescan = () => { setAsset(null); setTag(''); resetForm(); };
  const close = () => { setOpen(false); setTimeout(() => { rescan(); setScanning(false); }, 200); };

  const scan = () => {
    const q = tag.trim().toUpperCase();
    if (!q) return;
    setScanning(true);
    setTimeout(() => {
      const found = assets.find((a) => a.tag.toUpperCase() === q) ?? assets.find((a) => a.name.toUpperCase().includes(q));
      setScanning(false);
      if (!found) { toast.error(`No asset found for “${tag}”`); return; }
      setAsset(found);
    }, 650);
  };

  const confirm = () => {
    if (!asset) return;
    if (mode === 'out') {
      af.allocate({ assetId: asset.id, targetType: 'employee', employeeId: assignTo, expectedReturn: ret || null, condition: cond, note });
      toast.success(`${asset.tag} checked out to ${employeeName(assignTo)}`);
    } else if (mode === 'in') {
      const alloc = allocations.find((a) => a.assetId === asset.id && a.employeeId === asset.holderId && !a.returnedAt);
      if (alloc) {
        af.returnAllocation(alloc.id, { condition: cond, note });
      }
      toast.success(`${asset.tag} checked in from ${employeeName(asset.holderId)} · ${cond} condition`);
    }
    rescan();
  };

  const Icon = asset ? categoryIcon(getCategory(asset.categoryId)?.icon ?? '') : QrCode;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-fg-muted text-sm hover:border-brand/40 hover:text-fg transition active:scale-[0.97]"
        title="QR check-in / check-out"
      >
        <ScanLine className="w-4 h-4" />
        <span className="hidden md:inline font-medium">Check in/out</span>
      </button>

      <Modal open={open} onClose={close} title="QR Check-in / Check-out" width="max-w-lg">
        {!asset ? (
          /* ── Scan step ── */
          <div>
            <div className="grid place-items-center py-5">
              <div className={`relative grid place-items-center w-24 h-24 rounded-2xl border-2 border-dashed ${scanning ? 'border-brand' : 'border-border'} transition-colors`}>
                <QrCode className={`w-12 h-12 ${scanning ? 'text-brand animate-pulse' : 'text-fg-muted'}`} />
                {scanning && <span className="absolute inset-x-2 top-1/2 h-0.5 bg-brand/70 shadow-[0_0_8px] shadow-brand animate-pulse" />}
              </div>
              <p className="mt-4 text-sm text-fg-muted">{scanning ? 'Scanning tag…' : 'Scan or enter an asset tag'}</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); scan(); }}>
              <div className="flex gap-2">
                <Input list="asset-tags" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. AF-0012" autoFocus className="flex-1 font-mono" />
                <Button type="submit" disabled={scanning || !tag.trim()}><ScanLine className="w-4 h-4" /> Scan</Button>
              </div>
              <datalist id="asset-tags">
                {assets.map((a) => <option key={a.id} value={a.tag}>{a.name}</option>)}
              </datalist>
              <p className="text-xs text-fg-muted mt-2">Tip: an <span className="font-medium text-fg">available</span> asset checks out; an <span className="font-medium text-fg">allocated</span> one checks back in.</p>
            </form>
          </div>
        ) : (
          /* ── Result step ── */
          <div>
            {/* Asset summary */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3 mb-4">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-surface text-fg-muted shrink-0"><Icon className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg truncate">{asset.name}</p>
                <p className="text-xs text-fg-muted flex items-center gap-1"><span className="font-mono">{asset.tag}</span> · <MapPin className="w-3 h-3" /> {asset.location}</p>
              </div>
              <AssetStatusBadge status={asset.status} />
            </div>

            {mode === 'blocked' ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-fg">Can’t check this asset out</p>
                  <p className="text-sm text-fg-muted mt-0.5">Its status is <span className="font-medium text-fg">{asset.status}</span>. Resolve it in Maintenance or the Registry first.</p>
                </div>
              </div>
            ) : mode === 'out' ? (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium mb-4">
                  <ArrowRight className="w-4 h-4" /> Ready to check out
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4">
                  <Field label="Assign to"><Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} options={employees.filter((e) => e.status === 'active').map((e) => ({ value: e.id, label: e.name }))} placeholder="Select employee" /></Field>
                  <Field label="Expected return"><Input type="date" value={ret} onChange={(e) => setRet(e.target.value)} /></Field>
                </div>
                <Field label="Condition at checkout"><Select value={cond} onChange={(e) => setCond(e.target.value as Condition)} options={CONDITIONS} /></Field>
                <Field label="Note"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Accessories, purpose, condition details…" /></Field>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-2 text-sm font-medium mb-4">
                  <Undo2 className="w-4 h-4" /> Currently held by
                  <span className="inline-flex items-center gap-1.5 font-semibold"><Avatar name={employeeName(asset.holderId)} size="sm" /> {employeeName(asset.holderId)}</span>
                </div>
                <Field label="Condition on return"><Select value={cond} onChange={(e) => setCond(e.target.value as Condition)} options={CONDITIONS} /></Field>
                <Field label="Check-in note"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any damage or missing accessories…" /></Field>
              </div>
            )}

            <div className="flex justify-between gap-2 mt-2">
              <Button variant="ghost" onClick={rescan}><RotateCcw className="w-4 h-4" /> Scan another</Button>
              {mode === 'blocked' ? (
                <Button variant="ghost" onClick={close}>Close</Button>
              ) : (
                <Button onClick={confirm} disabled={mode === 'out' && !assignTo}>
                  <Check className="w-4 h-4" /> {mode === 'out' ? 'Confirm check-out' : 'Confirm check-in'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
