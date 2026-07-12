'use client';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { initials, titleCase } from '@/lib/format';

// Semantic-token primitives — correct in light AND dark with no extra work.
// Brand = blue (see tailwind.config.ts). Cards are flat + border-led; the
// accent carries the emphasis. This is the "Wolf slate + blue" language.

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-br from-brand-600 via-brand-500 to-purple-600 dark:from-brand-400 dark:via-brand-300 dark:to-purple-400 bg-clip-text text-transparent tracking-tight leading-normal drop-shadow-sm">{title}</h1>
        {subtitle && <p className="text-sm text-fg-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-surface/80 backdrop-blur-sm rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-lg hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-300 ease-spring', className)}>{children}</div>;
}

// Small caps section label — for grouping in sidebars, cards, forms.
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-wider text-fg-muted', className)}>{children}</p>;
}

const BADGE_TONES = {
  gray: 'bg-surface-2 text-fg-muted',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
};
export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', BADGE_TONES[tone] ?? BADGE_TONES.gray)}>{children}</span>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'accent' | 'ghost' | 'subtle' | 'danger'; size?: 'sm' | 'md' | 'lg' };
const BTN_VARIANTS = {
  primary: 'bg-gradient-to-r from-brand to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm shadow-brand/25 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5',
  accent: 'bg-gradient-to-r from-accent to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-sm shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5',
  ghost: 'bg-surface/50 text-fg border border-border hover:bg-surface-2 hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5',
  subtle: 'bg-surface-2 text-fg hover:bg-border/60 hover:shadow-sm hover:-translate-y-px',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5',
};
const BTN_SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' };
export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }: BtnProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold select-none',
        'transition-all duration-150 ease-spring active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('p-2 rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

// Initials avatar with a brand gradient. Used in the topbar + anywhere a
// person/entity needs a face (profiles, comments, lists).
const AVATAR_SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
export function Avatar({ name, size = 'md', className = '' }: { name?: string; size?: keyof typeof AVATAR_SIZES; className?: string }) {
  return (
    <div className={cn('inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold shrink-0 select-none', AVATAR_SIZES[size], className)}>
      {initials(name)}
    </div>
  );
}

// Pill filter tabs — the standard "browse by status/category" control for
// list & gallery pages. Accepts plain strings or {value,label}.
type TabOption = string | { value: string; label: string };
export function FilterTabs({ tabs, active, onChange, className = '' }: { tabs: TabOption[]; active: string; onChange: (v: string) => void; className?: string }) {
  const norm = tabs.map((t) => (typeof t === 'object' ? t : { value: t, label: titleCase(t) }));
  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {norm.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            'px-3.5 py-1.5 text-sm font-medium rounded-lg transition',
            active === t.value ? 'bg-brand text-white shadow-sm shadow-brand/25' : 'bg-surface border border-border text-fg-muted hover:text-fg hover:border-brand/40'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-lg border border-border bg-surface text-fg text-sm placeholder:text-fg-muted transition focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title = 'Nothing here yet', hint, action }: { icon?: LucideIcon; title?: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      {Icon && (
        <span className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/30 ring-1 ring-border text-fg-muted">
          <Icon className="w-7 h-7" />
        </span>
      )}
      <p className="font-semibold text-fg">{title}</p>
      {hint && <p className="text-sm text-fg-muted mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      {label && <span className="block text-sm font-medium text-fg mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-fg-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 dark:text-red-400 mt-1">{error}</span>}
    </label>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-fg text-sm placeholder:text-fg-muted transition focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT_CLASS, className)} />;
}
export function Textarea({ className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} {...props} className={cn(INPUT_CLASS, 'resize-y', className)} />;
}

type Option = string | { value: string; label: string };
export function Select({ options = [], placeholder = 'Select…', className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options?: Option[]; placeholder?: string }) {
  const norm = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  return (
    <select {...props} className={cn(INPUT_CLASS, 'appearance-none pr-8', className)}>
      {placeholder != null && <option value="">{placeholder}</option>}
      {norm.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      <input type="checkbox" {...props} className="w-4 h-4 rounded border-border text-brand focus:ring-brand/30 bg-surface" />
      {label && <span className="text-sm text-fg">{label}</span>}
    </label>
  );
}
