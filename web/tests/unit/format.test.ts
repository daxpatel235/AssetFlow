import { describe, it, expect } from 'vitest';
import { formatCurrency, titleCase } from '@/lib/format';

describe('format helpers', () => {
  it('formats currency', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('returns an em dash for non-numbers', () => {
    expect(formatCurrency('abc')).toBe('—');
  });

  it('title-cases snake/kebab strings', () => {
    expect(titleCase('due_date')).toBe('Due Date');
    expect(titleCase('created-at')).toBe('Created At');
  });
});
