import Link from 'next/link';
import {
  Boxes, ArrowRight, CheckCircle2, ShieldCheck, QrCode, CalendarClock, Wrench,
  ClipboardCheck, ArrowLeftRight, BarChart3, PackageCheck, Laptop, MapPin, Search,
  Building2, Download, AlertTriangle, Armchair, Car, Star, Target, Zap, Users,
} from 'lucide-react';
import { getSession } from '@/lib/auth';

type Session = Awaited<ReturnType<typeof getSession>>;

/* ------------------------------------------------------------------
   Public marketing landing — the front door. Deliberately LIGHT-ONLY
   (Wolf-style: white body, ivory-blue hero, blue accent, dark only for
   the CTA gradient). It does NOT use the theme-flipping semantic tokens
   on purpose — a marketing page should read the same for everyone.
   Server component: the session read is free and the CTA adapts to it.
   ------------------------------------------------------------------ */

const PILL: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  Allocated: 'bg-blue-100 text-blue-700',
  Reserved: 'bg-violet-100 text-violet-700',
  Maintenance: 'bg-amber-100 text-amber-700',
};

// ── Top nav ───────────────────────────────────────────────────────────────────
function Nav({ user }: { user: Session }) {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-100">
      <nav className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-600/30">
              <Boxes className="w-5 h-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">AssetFlow</span>
          </Link>
          <ul className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-slate-600">
            <li><a href="#lifecycle" className="hover:text-blue-600 transition">Lifecycle</a></li>
            <li><a href="#platform" className="hover:text-blue-600 transition">Platform</a></li>
            <li><a href="#features" className="hover:text-blue-600 transition">Features</a></li>
            <li><Link href="/about" className="hover:text-blue-600 transition">About Us</Link></li>
            <li><Link href="/qa" className="hover:text-blue-600 transition">Q&A</Link></li>
          </ul>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/25 transition">
              Go to dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold text-blue-600 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/60 transition">
                Sign in
              </Link>
              <Link href="/register" className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/25 transition">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ user }: { user: Session }) {
  return (
    <section
      className="relative overflow-hidden border-b border-slate-100"
      style={{
        backgroundColor: '#eef4ff',
        backgroundImage:
          'linear-gradient(to right, rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.06) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    >
      {/* soft glows + fade into white body */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-0 text-center animate-enter">

        <h1 className="mx-auto mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-[1.05] tracking-tight text-slate-900">
          Every asset accounted for, from{' '}
          <span className="text-blue-600">first scan to retirement</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Register, allocate, book, maintain and audit your organization&apos;s assets on one platform.
          No spreadsheets, no lost equipment, no double-bookings.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={user ? '/dashboard' : '/register'} className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition">
            {user ? 'Open your workspace' : 'Get started free'} <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
          {!user && (
            <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-sm transition">
              Sign in
            </Link>
          )}
        </div>
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          {['7-state lifecycle', 'QR-tagged assets', 'Audit-ready by design'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t}</li>
          ))}
        </ul>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  const nav = [
    { label: 'Dashboard', icon: BarChart3 },
    { label: 'Asset Registry', icon: Boxes, active: true },
    { label: 'Allocation', icon: ArrowLeftRight },
    { label: 'Booking', icon: CalendarClock },
    { label: 'Maintenance', icon: Wrench },
    { label: 'Audit', icon: ClipboardCheck },
  ];
  const rows = [
    { tag: 'AF-0012', name: 'MacBook Pro 16"', icon: Laptop, dept: 'Engineering', status: 'Available', holder: '' },
    { tag: 'AF-0007', name: 'Standing Desk', icon: Armchair, dept: 'Operations', status: 'Allocated', holder: 'PM' },
    { tag: 'AF-0021', name: 'Company Car', icon: Car, dept: 'Fleet', status: 'Maintenance', holder: '' },
    { tag: 'AF-0004', name: 'Conference Room A', icon: Building2, dept: 'Facilities', status: 'Reserved', holder: 'TM' },
    { tag: 'AF-0018', name: 'Projector 4K', icon: PackageCheck, dept: 'IT', status: 'Available', holder: '' },
  ];
  const kpis = [
    { label: 'Available', value: 9, cls: 'text-emerald-600' },
    { label: 'Allocated', value: 8, cls: 'text-blue-600' },
    { label: 'Maintenance', value: 3, cls: 'text-amber-600' },
  ];

  return (
    <div className="relative mt-14 mx-auto max-w-5xl">
      {/* floating chips */}
      <span className="hidden md:flex absolute -left-4 top-20 z-10 items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-lg shadow-slate-900/10 text-sm font-semibold text-slate-800">
        <QrCode className="w-4 h-4 text-blue-600" /> AF-0012 verified
      </span>
      <span className="hidden md:flex absolute -right-4 top-44 z-10 items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-lg shadow-slate-900/10 text-sm font-semibold text-slate-800">
        <ArrowLeftRight className="w-4 h-4 text-violet-600" /> Allocated to Priya
      </span>

      {/* app panel */}
      <div className="rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-2xl shadow-blue-900/10 overflow-hidden text-left">
        <div className="flex">
          {/* mini sidebar (mirrors the real slate rail) */}
          <aside className="hidden sm:flex w-52 shrink-0 flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-4">
            <div className="flex items-center gap-2 mb-6">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700"><Boxes className="w-4 h-4 text-white" /></span>
              <span className="font-bold text-white text-sm">AssetFlow</span>
            </div>
            <ul className="space-y-1">
              {nav.map((n) => {
                const Icon = n.icon;
                return (
                  <li key={n.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium ${n.active ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400'}`}>
                    <Icon className="w-4 h-4" /> {n.label}
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* main */}
          <div className="flex-1 min-w-0 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-slate-900 tracking-tight">Asset Registry</p>
                <p className="text-xs text-slate-500">24 assets across 5 categories</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" /> Register
              </span>
            </div>

            {/* KPI chips */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                  <p className={`text-2xl font-extrabold tabular-nums ${k.cls}`}>{k.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{k.label}</p>
                </div>
              ))}
            </div>

            {/* table */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span className="w-16">Tag</span><span className="flex-1">Asset</span><span className="w-20">Status</span><span className="w-8 text-right">Hold</span>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.tag} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="w-16 font-mono text-[11px] font-semibold text-blue-600">{r.tag}</span>
                      <span className="flex-1 min-w-0 flex items-center gap-2.5">
                        <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 shrink-0"><Icon className="w-3.5 h-3.5" /></span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-slate-800 truncate">{r.name}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{r.dept}</span>
                        </span>
                      </span>
                      <span className="w-20"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${PILL[r.status]}`}>{r.status}</span></span>
                      <span className="w-8 flex justify-end">
                        {r.holder
                          ? <span className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[9px] font-bold">{r.holder}</span>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lifecycle strip ─────────────────────────────────────────────────────────────
function Lifecycle() {
  const states = [
    { label: 'Available', dot: 'bg-emerald-500' },
    { label: 'Allocated', dot: 'bg-blue-500' },
    { label: 'Reserved', dot: 'bg-violet-500' },
    { label: 'Under Maintenance', dot: 'bg-amber-500' },
    { label: 'Lost', dot: 'bg-red-500' },
    { label: 'Retired', dot: 'bg-slate-400' },
    { label: 'Disposed', dot: 'bg-slate-400' },
  ];
  return (
    <section id="lifecycle" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-bold text-blue-600">The full lifecycle</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">One asset, seven states, zero blind spots</h2>
        <p className="mt-4 text-lg text-slate-600">Every status change is tracked with a complete chain of custody — you always know where an asset is and who has it.</p>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
        {states.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {s.label}
            </span>
            {i < states.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Alternating feature (asset detail mockup) ────────────────────────────────────
function AssetStory() {
  const points = [
    'Scan a QR tag to pull up any asset — identity, condition, location and current holder in one view.',
    'A full timeline of allocations, transfers, maintenance and audits for every unit.',
    'Category-specific custom fields capture exactly the data each asset type needs.',
  ];
  const timeline = [
    { t: 'Allocated to Priya Menon', d: 'Jun 28', tone: 'bg-blue-500' },
    { t: 'Returned · condition Good', d: 'Jun 12', tone: 'bg-emerald-500' },
    { t: 'Maintenance · screen repair', d: 'May 30', tone: 'bg-amber-500' },
    { t: 'Registered · AF-0012', d: 'Apr 02', tone: 'bg-slate-400' },
  ];
  return (
    <section id="platform" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* mockup */}
        <div className="relative rounded-3xl bg-slate-50 p-8 sm:p-12 order-2 lg:order-1">
          <div className="relative max-w-sm mx-auto">
            <span className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl" />
            <span className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br" />

            <div className="rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-blue-500/15 via-slate-50 to-violet-500/10 grid place-items-center relative">
                <Laptop className="w-9 h-9 text-blue-500/70" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Available</span>
                <span className="absolute top-2.5 right-2.5 grid place-items-center w-6 h-6 rounded-md bg-white/80 backdrop-blur text-slate-500"><QrCode className="w-3.5 h-3.5" /></span>
              </div>
              <div className="p-4">
                <p className="font-mono text-[11px] font-semibold text-blue-600">AF-0012</p>
                <p className="font-bold text-slate-900">MacBook Pro 16&quot;</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> HQ · Floor 3 · Engineering</p>
                <div className="mt-4 space-y-2.5">
                  {timeline.map((e) => (
                    <div key={e.t} className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${e.tone} shrink-0`} />
                      <span className="text-[12px] text-slate-600 flex-1 truncate">{e.t}</span>
                      <span className="text-[11px] text-slate-400">{e.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* copy */}
        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold text-blue-600">Complete visibility</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">See the whole story of every asset</h2>
          <ul className="mt-8 space-y-5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle2 className="w-[22px] h-[22px] text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
          <Link href="/register" className="mt-9 inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition">
            Get started <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Bento feature grid ──────────────────────────────────────────────────────────
const TONE: Record<string, string> = { blue: 'bg-blue-50', green: 'bg-emerald-50', white: 'bg-white border border-slate-200' };
function BentoCard({ tone = 'white', icon: Icon, title, children }: { tone?: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-3xl p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 ${TONE[tone]}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-white text-blue-600 shadow-sm"><Icon className="w-[18px] h-[18px]" /></span>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <div className="mt-4 mb-4 border-t border-dashed border-slate-300/70" />
      {children}
    </div>
  );
}

function Bento() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-bold text-blue-600">Everything in one place</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">A complete asset operations platform</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Col 1 */}
        <div className="space-y-5">
          <BentoCard tone="blue" icon={ArrowLeftRight} title="Conflict-free allocation">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500"><Laptop className="w-4 h-4" /></span>
                <span className="flex-1 text-sm font-semibold text-slate-800">MacBook Pro 16&quot;</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Allocated</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-[12px] font-medium text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Currently held by Priya M.
              </div>
              <div className="mt-3 flex justify-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"><ArrowLeftRight className="w-3.5 h-3.5" /> Request transfer</span>
              </div>
            </div>
          </BentoCard>

          <BentoCard tone="white" icon={ClipboardCheck} title="Audit cycles">
            <div className="rounded-2xl bg-slate-50 p-4">
              {[
                { l: 'Verified', v: 41, cls: 'text-emerald-600', bar: 'bg-emerald-400 w-5/6' },
                { l: 'Damaged', v: 3, cls: 'text-amber-600', bar: 'bg-amber-400 w-1/6' },
                { l: 'Missing', v: 1, cls: 'text-red-600', bar: 'bg-red-400 w-[8%]' },
              ].map((r) => (
                <div key={r.l} className="flex items-center gap-3 py-1.5">
                  <span className="w-16 text-xs font-medium text-slate-600">{r.l}</span>
                  <span className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden"><span className={`block h-full rounded-full ${r.bar}`} /></span>
                  <span className={`w-6 text-right text-sm font-bold tabular-nums ${r.cls}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        {/* Col 2 */}
        <div className="space-y-5">
          <BentoCard tone="green" icon={CalendarClock} title="Resource booking">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-4 gap-1.5 text-[9px] text-slate-400 font-semibold mb-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu'].map((d) => <span key={d} className="text-center">{d}</span>)}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  'bg-blue-500', 'bg-slate-100', 'bg-emerald-500', 'bg-slate-100',
                  'bg-slate-100', 'bg-violet-500', 'bg-slate-100', 'bg-blue-500',
                  'bg-emerald-500', 'bg-slate-100', 'bg-slate-100', 'bg-slate-100',
                ].map((c, i) => <span key={i} className={`h-7 rounded-md ${c}`} />)}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> No overlapping bookings
              </div>
            </div>
          </BentoCard>

          <BentoCard tone="blue" icon={Wrench} title="Maintenance workflows">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                {['Pending', 'Assigned', 'In progress', 'Resolved'].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className={`grid place-items-center w-6 h-6 rounded-full text-[10px] font-bold ${i <= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                    <span className="text-[9px] font-medium text-slate-500 text-center leading-tight">{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[9px] font-bold">RK</span>
                <span className="text-[12px] text-slate-600">Assigned to <span className="font-semibold text-slate-800">Rohan K.</span></span>
              </div>
            </div>
          </BentoCard>

          <BentoCard tone="white" icon={QrCode} title="QR-tagged assets">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <span className="grid place-items-center w-16 h-16 rounded-xl bg-white shadow-sm">
                <QrCode className="w-10 h-10 text-slate-900" />
              </span>
              <div>
                <p className="font-mono text-xs font-semibold text-blue-600">AF-0012</p>
                <p className="text-sm font-semibold text-slate-800">Scan to verify</p>
                <p className="text-[11px] text-slate-400">Instant asset lookup</p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Col 3 */}
        <div className="space-y-5">
          <BentoCard tone="blue" icon={Search} title="Search &amp; filter everything">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">macbook</span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { n: 'MacBook Pro 16"', t: 'AF-0012', s: 'Available' },
                  { n: 'MacBook Air M3', t: 'AF-0015', s: 'Allocated' },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-slate-800 truncate">{r.n}</span><span className="block text-[10px] text-slate-400 font-mono">{r.t}</span></span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PILL[r.s]}`}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <BentoCard tone="green" icon={BarChart3} title="Reports &amp; analytics">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-end justify-between mb-3">
                <div><p className="text-3xl font-extrabold text-slate-900 tabular-nums">78<span className="text-lg text-slate-400">%</span></p><p className="text-[11px] text-slate-500">Utilization rate</p></div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">▲ 6%</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {[45, 62, 40, 78, 58, 84, 70].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-sm"><Download className="w-4 h-4" /> Export report</span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

// ── Our Specialty ────────────────────────────────────────────────────────────────
function OurSpecialty() {
  const specialties = [
    {
      icon: Target,
      title: 'Precision Tracking',
      desc: 'We don’t just track the location; we track the financial depreciation, maintenance history, and chain of custody with forensic precision.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Workflows',
      desc: 'Our proprietary engine handles bulk allocations and multi-asset transfers instantly. No loading spinners, no waiting.',
    },
    {
      icon: Users,
      title: 'Built for Scale',
      desc: 'Whether you are managing 50 laptops in a startup or 50,000 industrial assets across the globe, AssetFlow scales effortlessly.',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 bg-slate-50 border-y border-slate-200">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="text-sm font-bold text-blue-600">Our Specialty</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Why enterprise teams choose us over legacy systems</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {specialties.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-6">
                <Icon className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Trusted by modern operators</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-lg text-slate-700 italic mb-6">"Before AssetFlow, we were using a mix of messy spreadsheets and legacy software that looked like it was from 1995. This platform is so incredibly fast and beautiful that our IT team actually enjoys auditing now."</p>
          <div className="flex items-center gap-3 mt-auto">
            <span className="w-10 h-10 rounded-full bg-slate-200 grid place-items-center font-bold text-slate-500">SM</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Sarah Mitchell</p>
              <p className="text-xs text-slate-500">VP of Operations, TechGrowth</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-lg text-slate-700 italic mb-6">"The QR code label generation alone saved us weeks of work. We literally generated a PDF, printed the labels, and tagged 500 assets in a single weekend. The bookings calendar is just the cherry on top."</p>
          <div className="flex items-center gap-3 mt-auto">
            <span className="w-10 h-10 rounded-full bg-slate-200 grid place-items-center font-bold text-slate-500">JD</span>
            <div>
              <p className="text-sm font-bold text-slate-900">James Davis</p>
              <p className="text-xs text-slate-500">Facilities Manager, BuildCorp</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA band (colorful blue gradient, not dark) ──────────────────────────────────
function CtaBand({ user }: { user: Session }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-8 sm:px-16 py-16 text-center">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Bring order to your asset operations</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-blue-100">Join teams tracking every asset with confidence — from first scan to retirement.</p>
        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={user ? '/dashboard' : '/register'} className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-lg shadow-blue-900/20 transition">
            {user ? 'Go to dashboard' : 'Get started free'} <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
          {!user && (
            <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white border border-white/40 hover:bg-white/10 rounded-xl transition">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Footer (light) ──────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: 'Platform', links: ['Asset Registry', 'Allocation', 'Resource Booking', 'Maintenance', 'Audit'] },
    { title: 'Company', links: ['About', 'Security', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Docs', 'Guides', 'Support', 'Status'] },
  ];
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white"><Boxes className="w-5 h-5" /></span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">AssetFlow</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-500">Enterprise asset &amp; resource management — track every asset across its full lifecycle, on one platform.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l}><Link href="/register" className="text-sm text-slate-500 hover:text-blue-600 transition">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} AssetFlow. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Audit-ready &amp; secure by design
          </div>
        </div>
      </div>
    </footer>
  );
}

export default async function LandingPage() {
  const user = await getSession();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav user={user} />
      <Hero user={user} />
      <Lifecycle />
      <AssetStory />
      <Bento />
      <OurSpecialty />
      <Testimonials />
      <CtaBand user={user} />
      <Footer />
    </div>
  );
}
