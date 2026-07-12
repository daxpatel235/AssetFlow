import Link from 'next/link';
import { Boxes, PackageCheck, ArrowLeftRight, ClipboardCheck } from 'lucide-react';

// Two-column auth shell: a dark brand panel (the "slate rail" identity, hidden
// on mobile) beside the form. Login + register just render their <Card> here.
const POINTS = [
  { icon: PackageCheck, title: 'Full asset lifecycle', body: 'Track every asset from Available to Retired with a complete chain of custody.' },
  { icon: ArrowLeftRight, title: 'Conflict-free allocation', body: 'Double-allocation is blocked and overlapping bookings are rejected automatically.' },
  { icon: ClipboardCheck, title: 'Audit-ready by design', body: 'Structured audit cycles, discrepancy reports, and a full activity log.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-900 text-slate-100 p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand/30">
            <Boxes className="w-5 h-5" />
          </span>
          <span className="font-bold tracking-tight text-lg">AssetFlow</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold tracking-tight leading-snug">Enterprise asset & resource management, done right.</h2>
          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-slate-800 text-brand-300">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-slate-400">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">Built to be adapted to almost any ERP or business-management problem.</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-enter">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Boxes className="w-5 h-5" />
            </span>
            <span className="font-bold tracking-tight text-lg text-fg">AssetFlow</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
