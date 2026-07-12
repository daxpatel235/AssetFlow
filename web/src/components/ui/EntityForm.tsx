'use client';
import { useState, type ReactNode } from 'react';
import { Field, Input, Textarea, Select, Checkbox, Button } from './kit';
import { ApiError } from '@/lib/api-client';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'currency' | 'textarea' | 'select' | 'checkbox' | 'date';

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
};

type Values = Record<string, unknown>;

// Config-driven create/edit form. Validates required fields, coerces numbers,
// and surfaces server-side field errors (ApiError.errors) inline.
export function EntityForm({
  fields,
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: {
  fields: FieldDef[];
  initial?: Values;
  onSubmit: (values: Values) => Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {};
    for (const f of fields) v[f.name] = initial[f.name] ?? (f.type === 'checkbox' ? false : '');
    return v;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (name: string, val: unknown) => setValues((p) => ({ ...p, [name]: val }));

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.required && (v === undefined || v === null || v === '' || v === false)) errs[f.name] = `${f.label} is required`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function serialize(): Values {
    const out: Values = {};
    for (const f of fields) {
      let v = values[f.name];
      if (f.type === 'number' || f.type === 'currency') v = v === '' ? undefined : Number(v);
      out[f.name] = v;
    }
    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await onSubmit(serialize());
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors((prev) => ({ ...prev, ...err.errors }));
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f) => (
        <Field key={f.name} label={f.label + (f.required ? ' *' : '')} hint={f.hint} error={errors[f.name]}>
          {renderInput(f, values[f.name], set)}
        </Field>
      ))}
      {formError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{formError}</p>}
      <div className="flex gap-2 justify-end mt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function renderInput(f: FieldDef, value: unknown, set: (name: string, val: unknown) => void): ReactNode {
  const v = value as string | boolean;
  switch (f.type) {
    case 'select':
      return <Select value={v as string} onChange={(e) => set(f.name, e.target.value)} options={f.options ?? []} placeholder={f.placeholder} />;
    case 'textarea':
      return <Textarea value={v as string} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
    case 'checkbox':
      return <Checkbox label="Yes" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />;
    case 'date':
      return <Input type="date" value={v ? String(v).slice(0, 10) : ''} onChange={(e) => set(f.name, e.target.value)} />;
    case 'number':
    case 'currency':
      return <Input type="number" step={f.type === 'currency' ? '0.01' : '1'} value={v as string} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
    default:
      return <Input type={f.type ?? 'text'} value={v as string} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
  }
}
