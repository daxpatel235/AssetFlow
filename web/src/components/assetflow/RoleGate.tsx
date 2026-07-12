'use client';
import { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/kit';
import { RoleBadge } from '@/components/assetflow/badges';
import { useAF } from '@/lib/store/assetflow-store';

// Page-level gate. The sidebar already hides forbidden destinations, but a direct
// URL should still be blocked — so gated pages wrap their body in <RoleGate>.
export function RoleGate({ allowed, title = 'Restricted area', children }: { allowed: boolean; title?: string; children: ReactNode }) {
  const { role, actingEmployee } = useAF();
  if (allowed) return <>{children}</>;
  return (
    <div className="max-w-lg mx-auto mt-10">
      <Card className="text-center py-12">
        <span className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
          <Lock className="w-7 h-7" />
        </span>
        <h2 className="text-lg font-bold text-fg">{title}</h2>
        <p className="text-sm text-fg-muted mt-1.5 max-w-sm mx-auto">
          Your current role doesn’t have access to this area. This is a secure, role-based workflow — switch your acting identity to a role that has permission.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-fg-muted">
          Acting as <span className="font-medium text-fg">{actingEmployee?.name}</span> <RoleBadge role={role} />
        </div>
      </Card>
    </div>
  );
}
