import { describe, it, expect } from 'vitest';
import { loginSchema, itemCreateSchema, listQuerySchema } from '@/lib/validation';

describe('validation schemas', () => {
  it('rejects an invalid email on login', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });

  it('accepts a valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('coerces item price/quantity from strings', () => {
    const parsed = itemCreateSchema.parse({ name: 'A', price: '9.99', quantity: '5' });
    expect(parsed.price).toBe(9.99);
    expect(parsed.quantity).toBe(5);
    expect(parsed.status).toBe('active'); // default applied
  });

  it('requires an item name', () => {
    expect(itemCreateSchema.safeParse({ price: 1 }).success).toBe(false);
  });

  it('applies list-query defaults and caps the limit', () => {
    const q = listQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.limit).toBe(20);
    expect(listQuerySchema.parse({ limit: '999' }).limit).toBe(100);
  });
});
