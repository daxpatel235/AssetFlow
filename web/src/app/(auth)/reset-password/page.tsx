'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Field, Input, Button } from '@/components/ui/kit';
import { useAuth } from '@/providers/AuthProvider';

function ResetForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Invalid reset link</h1>
        <p className="text-sm text-fg-muted mt-2">This link is missing its token. Request a new one to continue.</p>
        <Link href="/forgot-password" className="inline-block mt-6 text-sm font-semibold text-brand hover:underline">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Choose a new password</h1>
      <p className="text-sm text-fg-muted mt-1 mb-6">Pick something you haven&apos;t used before.</p>
      <form onSubmit={submit}>
        <Field label="New password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" required />
        </Field>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
      <p className="text-sm text-fg-muted mt-6 text-center">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
