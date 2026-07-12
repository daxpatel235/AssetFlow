'use client';
import { useMemo, useState } from 'react';
import { CalendarPlus, CalendarDays, Rows3, List, ChevronLeft, ChevronRight, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { PageHeader, Card, Button, Avatar, Field, Input, Select, Textarea, EmptyState } from '@/components/ui/kit';
import { Modal } from '@/components/ui/Modal';
import { Drawer, Segmented, DetailRow, fmtTimeRange, fmtDayLabel } from '@/components/assetflow/ui';
import { BookingStatusBadge } from '@/components/assetflow/badges';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { bookings as liveBookings, assets, asset as getAsset, employeeName, type Booking, type BookingStatus } from '@/lib/mock/assetflow';

const WIN_START = 8, WIN_END = 19; // schedule window hours
const HOURS = Array.from({ length: WIN_END - WIN_START }, (_, i) => WIN_START + i);
const sameDate = (iso: string, d: string) => iso.slice(0, 10) === d;
const hourFrac = (iso: string) => { const t = new Date(iso); return t.getHours() + t.getMinutes() / 60; };
const toPct = (h: number) => ((h - WIN_START) / (WIN_END - WIN_START)) * 100;

const BLOCK_TONE: Record<BookingStatus, string> = {
  ongoing: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
  upcoming: 'bg-blue-500/15 border-blue-500/50 text-blue-700 dark:text-blue-300',
  completed: 'bg-slate-400/15 border-slate-400/50 text-slate-600 dark:text-slate-300',
  cancelled: 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-300 line-through opacity-70',
};

function ScheduleGrid({ columns, onPick }: { columns: { key: string; label: string; sublabel?: string; items: Booking[] }[]; onPick: (b: Booking) => void }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] flex">
        {/* hour gutter */}
        <div className="w-14 shrink-0 pt-10">
          {HOURS.map((h) => (
            <div key={h} className="h-14 text-[11px] text-fg-muted text-right pr-2 -translate-y-2">{h}:00</div>
          ))}
        </div>
        {/* columns */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
          {columns.map((col) => (
            <div key={col.key} className="border-l border-border">
              <div className="h-10 px-2 flex flex-col justify-center border-b border-border sticky top-0 bg-surface">
                <p className="text-xs font-semibold text-fg truncate">{col.label}</p>
                {col.sublabel && <p className="text-[10px] text-fg-muted truncate">{col.sublabel}</p>}
              </div>
              <div className="relative" style={{ height: HOURS.length * 56 }}>
                {HOURS.map((h, i) => <div key={h} className="absolute left-0 right-0 border-b border-border/60" style={{ top: i * 56, height: 56 }} />)}
                {col.items.map((b) => {
                  const top = toPct(hourFrac(b.start));
                  const height = toPct(hourFrac(b.end)) - top;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onPick(b)}
                      className={`absolute left-1 right-1 rounded-lg border px-2 py-1 text-left overflow-hidden hover:shadow-card transition ${BLOCK_TONE[b.status]}`}
                      style={{ top: `${top}%`, height: `${Math.max(height, 6)}%` }}
                    >
                      <p className="text-[11px] font-semibold leading-tight truncate">{b.purpose}</p>
                      <p className="text-[10px] opacity-80 truncate">{fmtTimeRange(b.start, b.end)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const toast = useToast();
  const { v: _bv, createBooking, cancelBooking } = useAF(); // subscribe so the calendar reflects DB writes
  const bookable = assets.filter((a) => a.bookable);
  const bookings = liveBookings; // DB-hydrated in place
  const [view, setView] = useState<'day' | 'week' | 'list'>('day');
  const [date, setDate] = useState('2026-07-12');
  const [resourceId, setResourceId] = useState(bookable[0]?.id ?? '');
  const [picked, setPicked] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  // new-booking form
  const [fRes, setFRes] = useState(bookable[0]?.id ?? '');
  const [fDate, setFDate] = useState('2026-07-12');
  const [fStart, setFStart] = useState('09:00');
  const [fEnd, setFEnd] = useState('10:00');
  const [fPurpose, setFPurpose] = useState('');

  const conflict = useMemo(() => {
    const ns = new Date(`${fDate}T${fStart}`).getTime();
    const ne = new Date(`${fDate}T${fEnd}`).getTime();
    if (!(ne > ns)) return { kind: 'invalid' as const };
    const clash = bookings.find((b) => b.resourceId === fRes && b.status !== 'cancelled' && sameDate(b.start, fDate) && ns < new Date(b.end).getTime() && ne > new Date(b.start).getTime());
    return clash ? { kind: 'overlap' as const, clash } : null;
  }, [bookings, fRes, fDate, fStart, fEnd]);

  const dayColumns = bookable.map((r) => ({ key: r.id, label: r.name, sublabel: r.location, items: bookings.filter((b) => b.resourceId === r.id && sameDate(b.start, date)) }));

  const weekDays = useMemo(() => {
    const base = new Date(date + 'T00:00');
    const monday = new Date(base); monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d.toISOString().slice(0, 10); });
  }, [date]);
  const weekColumns = weekDays.map((d) => ({ key: d, label: new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' }), sublabel: new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), items: bookings.filter((b) => b.resourceId === resourceId && sameDate(b.start, d)) }));

  const shiftDate = (days: number) => setDate((d) => {
    const nd = new Date(d + 'T00:00');
    nd.setDate(nd.getDate() + days);
    return [nd.getFullYear(), String(nd.getMonth() + 1).padStart(2, '0'), String(nd.getDate()).padStart(2, '0')].join('-');
  });

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (conflict) { toast.error(conflict.kind === 'invalid' ? 'End time must be after the start time' : 'Time slot overlaps an existing booking'); return; }
    try {
      await createBooking({ resourceId: fRes, start: `${fDate}T${fStart}`, end: `${fDate}T${fEnd}`, purpose: fPurpose || 'New booking' });
      setOpen(false); setFPurpose('');
      setView('day'); setDate(fDate);
      toast.success('Booking confirmed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create booking');
    }
  }

  const upcoming = bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').sort((a, b) => +new Date(a.start) - +new Date(b.start));

  return (
    <div>
      <PageHeader title="Resource Booking" subtitle="Time-slot booking of shared rooms, vehicles and equipment — no overlaps">
        <Segmented options={[{ value: 'day', label: 'Day', icon: CalendarDays }, { value: 'week', label: 'Week', icon: Rows3 }, { value: 'list', label: 'List', icon: List }]} value={view} onChange={setView} />
        <Button onClick={() => { setFDate(date); setOpen(true); }}><CalendarPlus className="w-4 h-4" /> New Booking</Button>
      </PageHeader>

      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
          <Button variant="ghost" size="sm" onClick={() => shiftDate(view === 'week' ? -7 : -1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="relative flex items-center">
             <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
             <span className="text-sm font-semibold text-fg min-w-[9rem] text-center px-2 pointer-events-none">{view === 'week' ? `Week of ${fmtDayLabel(weekDays[0])}` : fmtDayLabel(date)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => shiftDate(view === 'week' ? 7 : 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        {view === 'week' && (
          <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)} options={bookable.map((r) => ({ value: r.id, label: r.name }))} placeholder="Resource" className="w-auto min-w-[12rem]" />
        )}
      </div>

      {view === 'list' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((b) => {
            const r = getAsset(b.resourceId);
            return (
              <Card key={b.id} className="flex items-start gap-3 hover:border-brand/40 transition cursor-pointer" >
                <button onClick={() => setPicked(b)} className="flex items-start gap-3 text-left w-full">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand/10 text-brand shrink-0"><CalendarDays className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2"><p className="font-semibold text-fg truncate">{b.purpose}</p><BookingStatusBadge status={b.status} /></div>
                    <p className="text-sm text-fg-muted truncate">{r?.name}</p>
                    <div className="flex items-center gap-3 text-xs text-fg-muted mt-2">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtDayLabel(b.start)} · {fmtTimeRange(b.start, b.end)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2"><Avatar name={employeeName(b.employeeId)} size="sm" /><span className="text-xs text-fg">{employeeName(b.employeeId)}</span></div>
                  </div>
                </button>
              </Card>
            );
          })}
          {!upcoming.length && <EmptyState icon={CalendarDays} title="No upcoming bookings" />}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ScheduleGrid columns={view === 'day' ? dayColumns : weekColumns} onPick={setPicked} />
        </Card>
      )}

      {/* New booking modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Booking" width="max-w-lg">
        <form onSubmit={submitBooking}>
          <Field label="Resource"><Select value={fRes} onChange={(e) => setFRes(e.target.value)} options={bookable.map((r) => ({ value: r.id, label: `${r.name} · ${r.location}` }))} placeholder="Select resource" /></Field>
          <Field label="Date"><Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Start"><Input type="time" value={fStart} onChange={(e) => setFStart(e.target.value)} /></Field>
            <Field label="End"><Input type="time" value={fEnd} onChange={(e) => setFEnd(e.target.value)} /></Field>
          </div>
          <Field label="Purpose"><Textarea value={fPurpose} onChange={(e) => setFPurpose(e.target.value)} placeholder="Meeting / trip purpose" /></Field>
          {conflict?.kind === 'overlap' && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-fg"><span className="font-semibold">Overlap detected.</span> Conflicts with <span className="font-medium">“{conflict.clash.purpose}”</span> ({fmtTimeRange(conflict.clash.start, conflict.clash.end)}). Pick a slot that starts after it ends.</p>
            </div>
          )}
          {conflict?.kind === 'invalid' && <p className="text-sm text-red-500 mb-4">End time must be after start time.</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!!conflict}><CalendarPlus className="w-4 h-4" /> Confirm Booking</Button></div>
        </form>
      </Modal>

      {/* Booking details drawer */}
      <Drawer open={!!picked} onClose={() => setPicked(null)} title={picked?.purpose} subtitle={picked ? getAsset(picked.resourceId)?.name : ''}
        footer={picked && picked.status === 'upcoming' ? (
          <div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={async () => { const id = picked.id; setPicked(null); try { await cancelBooking(id); toast.info('Booking cancelled'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not cancel'); } }}>Cancel booking</Button><Button className="flex-1" onClick={() => { setPicked(null); toast.success('Reschedule saved'); }}>Reschedule</Button></div>
        ) : undefined}>
        {picked && (
          <div className="space-y-4">
            <BookingStatusBadge status={picked.status} />
            <div className="rounded-xl border border-border p-4">
              <DetailRow label="Resource">{getAsset(picked.resourceId)?.name}</DetailRow>
              <DetailRow label="Location"><span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-fg-muted" />{getAsset(picked.resourceId)?.location}</span></DetailRow>
              <DetailRow label="Date">{fmtDayLabel(picked.start)}</DetailRow>
              <DetailRow label="Time">{fmtTimeRange(picked.start, picked.end)}</DetailRow>
              <DetailRow label="Booked by">{employeeName(picked.employeeId)}</DetailRow>
            </div>
            <div className="rounded-lg bg-surface-2/50 border border-border p-3 text-sm text-fg-muted flex items-center gap-2"><Clock className="w-4 h-4" /> A reminder is sent 30 minutes before the slot starts.</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
