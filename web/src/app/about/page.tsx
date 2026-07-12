import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Zap, Globe, Layers, Users, Server } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/20">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200 shadow-sm">
        <nav className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/about" className="text-blue-600">About Us</Link>
            <Link href="/qa" className="hover:text-blue-600 transition">Q&A</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 animate-enter">
        <div className="mb-16 pb-16 border-b border-slate-200">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">The AssetFlow Documentation</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
            The unified system of record for the modern enterprise.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
            AssetFlow was built to solve the fragmentation of physical resource tracking. We believe that knowing exactly where your assets are, who holds them, and what state they are in should be an instant, deterministic query—not a multi-day auditing nightmare.
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-600" /> 
            1. The Core Architecture
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            At its core, AssetFlow operates as an event-sourced ledger. Rather than simply overwriting an asset's location when it moves, our system appends immutable "Transfer" and "Allocation" events to the asset's timeline. This means every physical item in your organization possesses a strict, auditable chain of custody. If a high-value engineering laptop goes missing in Q3, you can query the exact timestamp, location, and authorizing manager who signed off on its last transfer in Q2.
          </p>
          <p className="text-slate-600 leading-relaxed mb-12">
            The system's user interface is built on a highly optimized Next.js architecture, utilizing a lightning-fast global state engine to ensure that even organizations with massive hardware fleets can filter, sort, and navigate complex asset graphs with zero loading spinners or network latency.
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" /> 
            2. The Ecosystem
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            AssetFlow isn't just an inventory tracker; it is a full-lifecycle resource platform divided into five core modules:
          </p>
          <ul className="space-y-4 mb-12 list-none pl-0">
            <li className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-sm">A</span>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Asset Registry</strong>
                <span className="text-slate-600 text-base">The central nervous system. Allows bulk import via CSV/Excel, automated QR code generation, and categorization into hierarchical departments.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">B</span>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Resource Bookings</strong>
                <span className="text-slate-600 text-base">A conflict-free calendar engine allowing staff to reserve shared fleet vehicles, conference rooms, or specialized testing equipment.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-sm">M</span>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Maintenance & Ticketing</strong>
                <span className="text-slate-600 text-base">Integrated repair tracking that automatically flags broken assets, assigns technicians, and tracks repair costs against asset depreciation.</span>
              </div>
            </li>
          </ul>

          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" /> 
            3. Enterprise Security & RBAC
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Security is not an afterthought. AssetFlow is designed for organizations that require strict compliance (SOC2, ISO 27001). Our Role-Based Access Control (RBAC) engine operates at the API route level, not just the UI layer. 
          </p>
          <p className="text-slate-600 leading-relaxed mb-12">
            A standard <strong>User</strong> can only initiate transfer requests and view assets explicitly allocated to them. A <strong>Department Manager</strong> can approve transfers and run utilization reports strictly within their assigned department. <strong>Global Admins</strong> have cross-departmental override capabilities and can trigger organization-wide blind audits. All destructive actions (like retiring a $50k server) require cryptographic signature from an Admin token.
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-600" /> 
            4. Audits & Compliance
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The scariest time for any IT or Operations department is audit season. AssetFlow turns audits into a continuous, low-friction process. Using the companion mobile view, auditors can walk through an office or warehouse, rapidly scanning QR labels. The system instantly reconciles scanned physical assets against the digital ledger, automatically flagging "Missing" or "Misplaced" assets in a real-time variance report.
          </p>
        </div>
      </main>
    </div>
  );
}
