'use client';
import { ShieldCheck } from 'lucide-react';
import { Select } from '@/components/ui/kit';
import { useAF } from '@/lib/store/assetflow-store';
import { employees } from '@/lib/mock/assetflow';
import { cn } from '@/lib/cn';

const roleLabel = (r: string) => r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Demo control: switch the "acting" identity to see role-based access in action.
// The whole app (sidebar, page gates, action buttons, My Workspace) adapts.
export function IdentitySwitcher({ className, showIcon = true }: { className?: string; showIcon?: boolean }) {
  const { actingId, setActingId } = useAF();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5" /> Acting as
        </span>
      )}
      <Select
        value={actingId}
        onChange={(e) => setActingId(e.target.value)}
        options={employees.filter((e) => e.status === 'active').map((e) => ({ value: e.id, label: `${e.name} · ${roleLabel(e.role)}` }))}
        placeholder=""
        className="w-auto min-w-[12rem] py-1.5 text-xs"
        title="Switch acting identity (demo RBAC)"
      />
    </div>
  );
}
