'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Field, Input, Button } from '@/components/ui/kit';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Create your account</h1>
      <p className="text-sm text-fg-muted mt-1 mb-6">Join your organization&apos;s asset workspace in under a minute.</p>
      <form onSubmit={submit}>
        <Field label="Name">
          <Input value={form.name} onChange={set('name')} placeholder="Ada Lovelace" autoComplete="name" required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" required />
        </Field>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="text-xs text-fg-muted mt-4 text-center">New accounts join as an <span className="font-medium text-fg">Employee</span>. An administrator can elevate your role later.</p>
      <p className="text-sm text-fg-muted mt-6 text-center">
        Have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
