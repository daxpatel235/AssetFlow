'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Card, Field, Input, Button } from '@/components/ui/kit';
import { useAuth } from '@/providers/AuthProvider';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full text-center">
        <span className="mx-auto grid place-items-center w-12 h-12 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 mb-4">
          <MailCheck className="w-6 h-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Check your email</h1>
        <p className="text-sm text-fg-muted mt-2">
          If an account exists for <span className="font-medium text-fg">{email}</span>, a reset link is on its way. The link expires in 1 hour.
        </p>
        <p className="text-xs text-fg-muted mt-4">
          No SMTP configured? The link is printed to your <span className="font-medium text-fg">server console</span>.
        </p>
        <Link href="/login" className="inline-block mt-6 text-sm font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Forgot your password?</h1>
      <p className="text-sm text-fg-muted mt-1 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={submit}>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </Field>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <p className="text-sm text-fg-muted mt-6 text-center">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
