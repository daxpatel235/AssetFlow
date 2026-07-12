'use client';
import { useState, useEffect } from 'react';
import {
  User, Mail, Shield, Building2, Bell, LayoutGrid, LogOut, Palette, Monitor, Moon as MoonIcon,
  Sun, Eye, Clock,
} from 'lucide-react';
import { PageHeader, Card, Avatar } from '@/components/ui/kit';
import { RoleBadge } from '@/components/assetflow/badges';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { departmentName } from '@/lib/mock/assetflow';

const PREFS_KEY = 'assetflow_prefs';
const DEFAULT_PREFS = {
  emailNotifications: true,
  approvalAlerts: true,
  overdueReminders: true,
  compactTables: false,
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        on ? 'bg-brand' : 'bg-surface-2 border border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, capitalize }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-fg-muted mt-0.5 shrink-0" />
      <div>
        <dt className="text-xs text-fg-muted">{label}</dt>
        <dd className={`text-fg font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</dd>
      </div>
    </div>
  );
}

// ── Preference toggle row ────────────────────────────────────────────────────
function PrefRow({ icon: Icon, label, hint, on, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="w-[18px] h-[18px] text-fg-muted mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{label}</p>
          <p className="text-xs text-fg-muted">{hint}</p>
        </div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const af = useAF();
  const actingEmp = af.actingEmployee;

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      setPrefs({ ...DEFAULT_PREFS, ...saved });
    } catch {
      /* ignore bad json */
    }
  }, []);

  const togglePref = (key: keyof typeof DEFAULT_PREFS) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences and appearance." />

      {/* ── Profile ── */}
      <Card className="mb-6">
        <h2 className="text-base font-bold text-fg mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <span className="relative shrink-0 rounded-2xl p-0.5 bg-gradient-to-br from-brand-400 to-brand-700">
            <Avatar name={user?.name ?? actingEmp?.name} size="lg" className="ring-2 ring-surface" />
          </span>
          <div>
            <p className="text-lg font-bold text-fg">{user?.name ?? actingEmp?.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <RoleBadge role={af.role} />
              {actingEmp && <span className="text-sm text-fg-muted">{actingEmp.title}</span>}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Full name" value={user?.name ?? actingEmp?.name} />
          <InfoRow icon={Mail} label="Email" value={user?.email ?? actingEmp?.email} />
          <InfoRow icon={Shield} label="Role" value={af.role.replace('_', ' ')} capitalize />
          <InfoRow icon={Building2} label="Department" value={actingEmp ? departmentName(actingEmp.departmentId) : '—'} />
        </dl>
      </Card>

      {/* ── Appearance ── */}
      <Card className="mb-6">
        <h2 className="text-base font-bold text-fg mb-1">Appearance</h2>
        <p className="text-sm text-fg-muted mb-5">Customize how AssetFlow looks on your device.</p>

        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-start gap-3 min-w-0">
            <Palette className="w-[18px] h-[18px] text-fg-muted mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">Theme</p>
              <p className="text-xs text-fg-muted">Switch between light and dark mode.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-surface-2/50">
            {([
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: MoonIcon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ] as const).map((opt) => {
              const active = theme === opt.value || (opt.value === 'system' && !['light', 'dark'].includes(theme));
              return (
                <button
                  key={opt.value}
                  onClick={() => { if (!active) toggleTheme(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    active
                      ? 'bg-surface text-fg shadow-sm border border-border'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Notifications & preferences ── */}
      <Card className="mb-6">
        <h2 className="text-base font-bold text-fg mb-1">Notifications & Preferences</h2>
        <p className="text-sm text-fg-muted mb-3">These are saved in your browser.</p>

        <div className="divide-y divide-border">
          <PrefRow
            icon={Bell}
            label="Email notifications"
            hint="Get an email when something needs your attention."
            on={prefs.emailNotifications}
            onClick={() => togglePref('emailNotifications')}
          />
          <PrefRow
            icon={Shield}
            label="Approval alerts"
            hint="Notify me when an item is waiting for my sign-off."
            on={prefs.approvalAlerts}
            onClick={() => togglePref('approvalAlerts')}
          />
          <PrefRow
            icon={Clock}
            label="Overdue reminders"
            hint="Get alerted when a return date passes without check-in."
            on={prefs.overdueReminders}
            onClick={() => togglePref('overdueReminders')}
          />
          <PrefRow
            icon={LayoutGrid}
            label="Compact tables"
            hint="Show more rows by tightening table spacing."
            on={prefs.compactTables}
            onClick={() => togglePref('compactTables')}
          />
        </div>
      </Card>

      {/* ── Permissions ── */}
      <Card className="mb-6">
        <h2 className="text-base font-bold text-fg mb-1">Your Permissions</h2>
        <p className="text-sm text-fg-muted mb-4">Based on your current role ({af.role.replace('_', ' ')}). Contact an admin to change.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {(Object.entries(af.perms) as [string, boolean][]).map(([key, allowed]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-fg">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                allowed
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-surface-2 text-fg-muted'
              }`}>
                {allowed ? 'Allowed' : 'Denied'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Sign out ── */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-fg">Sign out</p>
          <p className="text-sm text-fg-muted">End your session on this device.</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/[0.05] rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </Card>
    </div>
  );
}
