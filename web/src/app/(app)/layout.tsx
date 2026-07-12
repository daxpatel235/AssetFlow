'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Sun, Moon, Menu, X, ChevronDown, Boxes, Settings } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { IconButton, Avatar } from '@/components/ui/kit';
import { LoadingScreen } from '@/components/ui/feedback';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { CheckInOut } from '@/components/assetflow/CheckInOut';
import { IdentitySwitcher } from '@/components/assetflow/IdentitySwitcher';
import { RoleBadge } from '@/components/assetflow/badges';
import { AssetFlowProvider, useAF } from '@/lib/store/assetflow-store';
import { NAV, NAV_SECTIONS } from '@/config/nav';
import { cn } from '@/lib/cn';
import NextTopLoader from 'nextjs-toploader';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssetFlowProvider>
      <NextTopLoader color="#8b5cf6" showSpinner={false} shadow="0 0 10px #8b5cf6,0 0 5px #8b5cf6" />
      <AppShell>{children}</AppShell>
    </AssetFlowProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { role } = useAF();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer + user menu whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  if (loading) return <LoadingScreen />;

  const isActive = (href: string) => (href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href));
  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(role));

  async function handleLogout() {
    await logout();
    router.replace('/'); // back to the public landing page
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ============ SIDEBAR (always dark — the fixed "slate rail") ============ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/90 backdrop-blur-xl text-slate-100 flex flex-col transition-transform duration-300 ease-spring lg:translate-x-0 no-print border-r border-slate-800/60 shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand/30">
              <Boxes className="w-5 h-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-bold tracking-tight">AssetFlow</span>
              <span className="block text-xs text-slate-400 -mt-0.5">Asset & Resource Mgmt</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav — grouped by section */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 slate-scroll">
          {NAV_SECTIONS.filter((section) => visibleNav.some((n) => n.section === section)).map((section) => (
            <div key={section} className="space-y-1">
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section}</p>
              {visibleNav.filter((n) => n.section === section).map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-spring',
                      active
                        ? 'bg-brand/15 text-brand-300 shadow-sm shadow-brand/10'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white hover:translate-x-0.5'
                    )}
                  >
                    <span className={cn('absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-400 transition-all duration-200 ease-spring', active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0')} />
                    <Icon className={cn('w-[18px] h-[18px] transition-transform duration-200 ease-spring', active ? 'text-brand-300 scale-110' : 'text-slate-400 group-hover:text-white')} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="p-3">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/60 px-3 py-2.5">
            <p className="text-xs text-slate-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-200 font-sans text-[11px] font-semibold">⌘K</kbd> to search anything
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden no-print" />}

      {/* ============ MAIN COLUMN ============ */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-surface/75 backdrop-blur-lg border-b border-border shadow-sm no-print">
          <div className="flex items-center justify-between h-16 px-4 sm:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-fg-muted hover:text-fg shrink-0" aria-label="Open menu">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0 max-w-md">
              <GlobalSearch />
            </div>
            <IdentitySwitcher className="hidden lg:flex" />
            <CheckInOut />
            <NotificationBell />
            <IconButton onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </IconButton>

            <div className="hidden sm:block h-8 w-px bg-border" />

            {/* User dropdown */}
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 p-1 sm:pr-2 rounded-lg hover:bg-surface-2 transition">
                <Avatar name={user?.name} size="sm" />
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-semibold text-fg truncate max-w-[8rem]">{user?.name}</span>
                  <span className="block text-xs text-fg-muted capitalize">{role.replace('_', ' ')}</span>
                </span>
                <ChevronDown className={cn('hidden sm:block w-4 h-4 text-fg-muted transition', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30" />
                  <div className="absolute right-0 mt-2 w-64 z-40 bg-surface rounded-xl border border-border shadow-pop overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-fg truncate">{user?.name}</p>
                      <p className="text-xs text-fg-muted truncate">{user?.email}</p>
                    </div>
                    <div className="px-4 py-3 border-b border-border lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Acting as</span>
                        <RoleBadge role={role} />
                      </div>
                      <IdentitySwitcher showIcon={false} className="w-full [&>div]:w-full [&_select]:w-full" />
                      <p className="text-[11px] text-fg-muted mt-1.5">Switch role to preview access.</p>
                    </div>
                    <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-fg hover:bg-surface-2 transition border-b border-border">
                      <Settings className="w-4 h-4 text-fg-muted" /> Settings
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-surface-2 transition">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
