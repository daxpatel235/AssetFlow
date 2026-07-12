'use client';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, UserPlus, CalendarPlus, Wrench, FileText, Download, MapPin, ShieldCheck, Boxes,
  History, ClipboardList, Info, CircleDot, Printer, Maximize2,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, SectionLabel, EmptyState } from '@/components/ui/kit';
import { Tabs, DetailRow } from '@/components/assetflow/ui';
import { Modal } from '@/components/ui/Modal';
import { Timeline, type TimelineItem } from '@/components/ui/Timeline';
import { AssetStatusBadge, ConditionBadge, AllocationStatusBadge, MaintenanceStatusBadge, PriorityBadge, categoryIcon } from '@/components/assetflow/badges';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { formatCurrency, formatDate } from '@/lib/format';
import { download, downloadAssetDocumentPdf } from '@/lib/export';
import { generateSecureQRPayload, generateQRSvgString } from '@/lib/qr';
import {
  assets, allocations, maintenance, category as getCategory, department as getDepartment,
  employeeName, categoryName, type Asset,
} from '@/lib/mock/assetflow';

// Secure, time-limited QR code generator
function RealQR({ payload, size = 128 }: { payload: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const QRCode = require('qrcode');

  useEffect(() => {
    QRCode.toDataURL(payload, {
      margin: 1,
      width: size,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then((url: string) => setDataUrl(url));
  }, [payload, size, QRCode]);

  if (!dataUrl) {
    return <div className="animate-pulse bg-surface-2 rounded-lg" style={{ width: size, height: size }} />;
  }

  return <img src={dataUrl} alt="Asset QR Code" width={size} height={size} className="rounded-lg shadow-sm ring-1 ring-border" />;
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const af = useAF(); // subscribe so status changes made elsewhere reflect here
  const [tab, setTab] = useState('overview');
  const [qrOpen, setQrOpen] = useState(false);
  const item = assets.find((a) => a.id === id) as Asset | undefined;

  if (!item) {
    return <div className="py-20"><EmptyState icon={Boxes} title="Asset not found" hint="It may have been retired or the link is wrong." /></div>;
  }

  const cat = getCategory(item.categoryId);
  const Icon = categoryIcon(cat?.icon ?? '');
  const allocs = allocations.filter((a) => a.assetId === item.id).sort((a, b) => +new Date(b.allocatedAt) - +new Date(a.allocatedAt));
  const maints = maintenance.filter((m) => m.assetId === item.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const timeline: TimelineItem[] = [
    ...allocs.map((a) => ({ id: 'al' + a.id, title: a.returnedAt ? 'Returned' : 'Allocated', description: `${a.returnedAt ? 'by' : 'to'} ${employeeName(a.employeeId)}`, time: a.returnedAt ?? a.allocatedAt, icon: UserPlus, tone: 'blue' as const })),
    ...maints.map((m) => ({ id: 'm' + m.id, title: 'Maintenance ' + m.status.replace('_', ' '), description: m.issue, time: m.createdAt, icon: Wrench, tone: 'red' as const })),
  ].sort((a, b) => +new Date(b.time as string) - +new Date(a.time as string));

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'allocation', label: 'Allocation History', count: allocs.length },
    { value: 'maintenance', label: 'Maintenance', count: maints.length },
    { value: 'timeline', label: 'Timeline' },
  ];

  return (
    <div>
      <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-4"><ArrowLeft className="w-4 h-4" /> Back to registry</Link>

      <PageHeader title={item.name} subtitle={`${item.tag} · ${categoryName(item.categoryId)}`}>
        {af.perms.allocate && <Button variant="ghost" size="sm" onClick={() => { router.push('/allocations'); toast.info('Opening allocation…'); }}><UserPlus className="w-4 h-4" /> Allocate</Button>}
        {item.bookable && <Button variant="ghost" size="sm" onClick={() => router.push('/bookings')}><CalendarPlus className="w-4 h-4" /> Book</Button>}
        <Button variant="ghost" size="sm" onClick={() => router.push('/maintenance')}><Wrench className="w-4 h-4" /> Maintenance</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left rail */}
        <div className="space-y-4">
          <Card>
            <div className="relative h-40 -mx-5 -mt-5 mb-5 rounded-t-2xl bg-gradient-to-br from-brand-500/15 via-surface-2 to-violet-500/10 grid place-items-center">
              <Icon className="w-16 h-16 text-brand/60" />
              <span className="absolute top-3 left-3"><AssetStatusBadge status={item.status} icon /></span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <SectionLabel>Identification</SectionLabel>
              <ConditionBadge condition={item.condition} />
            </div>
            <DetailRow label="Asset tag"><span className="font-mono text-brand">{item.tag}</span></DetailRow>
            <DetailRow label="Serial no."><span className="font-mono">{item.serial}</span></DetailRow>
            <DetailRow label="Location"><span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-fg-muted" />{item.location}</span></DetailRow>
            <DetailRow label="Department">{item.departmentId ? getDepartment(item.departmentId)?.name : '—'}</DetailRow>
            <DetailRow label="Held by">{item.holderId ? employeeName(item.holderId) : 'Unassigned'}</DetailRow>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3"><SectionLabel>QR / Barcode</SectionLabel></div>
            <div className="flex items-center gap-4">
              <button onClick={() => setQrOpen(true)} className="group relative shrink-0 rounded-lg cursor-zoom-in" title="Click to enlarge">
                <RealQR payload={generateSecureQRPayload(item.tag)} />
                <span className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-brand/50 grid place-items-center transition">
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition"><Maximize2 className="w-4 h-4" /></span>
                </span>
              </button>
              <div className="text-sm">
                <p className="font-mono font-semibold text-fg">{item.tag}</p>
                <p className="text-fg-muted text-xs mt-1">Scan to check out, verify, or report an issue. This code uniquely identifies the asset.</p>
                <Button size="sm" variant="ghost" className="mt-3" onClick={() => setQrOpen(true)}><Maximize2 className="w-3.5 h-3.5" /> View QR</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-fg-muted" /><SectionLabel>Documents</SectionLabel></div>
            <ul className="space-y-2">
              {['Purchase invoice.pdf', 'Warranty certificate.pdf', 'User manual.pdf'].map((d) => (
                <li key={d} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-surface-2 transition cursor-pointer" onClick={() => downloadAssetDocumentPdf(item, d).then(() => toast.success(`${d} saved`))}>
                  <span className="flex items-center gap-2 text-sm text-fg min-w-0"><FileText className="w-4 h-4 text-fg-muted shrink-0" /><span className="truncate">{d}</span></span>
                  <Download className="w-4 h-4 text-fg-muted shrink-0" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Main */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 pt-2"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
            <div className="p-5">
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Info className="w-4 h-4 text-fg-muted" /><SectionLabel>Acquisition & Value</SectionLabel></div>
                    <div className="grid sm:grid-cols-2 gap-x-8">
                      <DetailRow label="Acquisition date">{formatDate(item.acquisitionDate)}</DetailRow>
                      <DetailRow label="Acquisition cost"><span className="font-semibold">{formatCurrency(item.acquisitionCost)}</span></DetailRow>
                      <DetailRow label="Bookable">{item.bookable ? 'Yes — shared resource' : 'No'}</DetailRow>
                      <DetailRow label="Warranty">{item.warrantyEnds ? `until ${formatDate(item.warrantyEnds)}` : '—'}</DetailRow>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3"><ClipboardList className="w-4 h-4 text-fg-muted" /><SectionLabel>{cat?.name} — Custom Fields</SectionLabel></div>
                    {cat?.fields.length ? (
                      <div className="grid sm:grid-cols-2 gap-x-8">
                        {cat.fields.map((f) => {
                          const val = item.customData?.[f.name];
                          return (
                            <DetailRow key={f.name} label={f.name}>
                              {val === undefined || val === null || val === '' ? '—' : f.type === 'date' ? formatDate(String(val)) : f.type === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                            </DetailRow>
                          );
                        })}
                      </div>
                    ) : <p className="text-sm text-fg-muted">No custom fields for this category.</p>}
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/40 p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-fg-muted">This asset has a complete chain of custody. All allocations, transfers and maintenance are recorded in the history tabs and immutable activity log.</p>
                  </div>
                </div>
              )}

              {tab === 'allocation' && (
                allocs.length ? (
                  <ul className="space-y-3">
                    {allocs.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 rounded-xl border border-border p-3.5">
                        <Avatar name={employeeName(a.employeeId)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-fg truncate">{employeeName(a.employeeId)}</p>
                            <AllocationStatusBadge status={a.status} />
                          </div>
                          <p className="text-xs text-fg-muted mt-0.5">
                            {formatDate(a.allocatedAt)} → {a.returnedAt ? formatDate(a.returnedAt) : a.expectedReturn ? `due ${formatDate(a.expectedReturn)}` : 'open'}
                          </p>
                          {(a.checkoutNote || a.checkinNote) && <p className="text-sm text-fg mt-1.5">{a.checkinNote ?? a.checkoutNote}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState icon={History} title="No allocation history" hint="This asset has never been checked out." />
              )}

              {tab === 'maintenance' && (
                maints.length ? (
                  <ul className="space-y-3">
                    {maints.map((m) => (
                      <li key={m.id} className="rounded-xl border border-border p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="flex items-center gap-2"><PriorityBadge priority={m.priority} /><MaintenanceStatusBadge status={m.status} /></span>
                          <span className="text-xs text-fg-muted">{formatDate(m.createdAt)}</span>
                        </div>
                        <p className="text-sm text-fg">{m.issue}</p>
                        {m.technicianId && <p className="text-xs text-fg-muted mt-1">Technician: {employeeName(m.technicianId)}{m.cost ? ` · ${formatCurrency(m.cost)}` : ''}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState icon={Wrench} title="No maintenance history" hint="No repairs recorded for this asset." />
              )}

              {tab === 'timeline' && (timeline.length ? <Timeline items={timeline} /> : <EmptyState icon={CircleDot} title="No events yet" />)}
            </div>
          </Card>
        </div>
      </div>

      {/* Centered QR viewer — background blurs via the Modal backdrop */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Asset QR code" width="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <RealQR payload={generateSecureQRPayload(item.tag)} size={224} />
          <p className="mt-4 font-mono font-bold text-lg text-fg">{item.tag}</p>
          <p className="text-sm text-fg-muted">{item.name}</p>
          <p className="text-xs text-fg-muted mt-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</p>
          <p className="text-xs text-fg-muted mt-3 max-w-[16rem]">Scan to check out, verify, or report an issue. This static code identifies the asset permanently.</p>
          <div className="flex gap-2 mt-5">
            <Button variant="ghost" size="sm" onClick={async () => {
              const svg = await generateQRSvgString(generateSecureQRPayload(item.tag));
              download(new Blob([svg], { type: 'image/svg+xml' }), `${item.tag}-qr.svg`).then(() => toast.success('QR downloaded'));
            }}><Download className="w-4 h-4" /> Download</Button>
            <Button size="sm" onClick={() => toast.info('QR label sent to printer (demo)')}><Printer className="w-4 h-4" /> Print label</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
