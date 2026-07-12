import { z } from 'zod';

// Single source of truth for shapes — used by API routes (parse input) AND the
// client (form typing). Change a rule once, both sides update.

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const itemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().default(''),
  price: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'archived']).default('active'),
});

// All fields optional on update (PATCH semantics).
export const itemUpdateSchema = itemCreateSchema.partial();

// Shared list query for any resource. page/limit never 400 on junk input —
// they fall back to defaults and clamp to safe bounds.
export const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z
    .coerce.number()
    .int()
    .catch(1)
    .transform((n) => Math.max(n, 1)),
  limit: z
    .coerce.number()
    .int()
    .catch(20)
    .transform((n) => Math.min(Math.max(n, 1), 100)),
  sort: z.string().optional(),
  status: z.string().optional(),
  // .passthrough() lets generated modules filter on their own enum fields
  // (e.g. ?priority=high) without editing this schema.
}).passthrough();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ItemInput = z.infer<typeof itemCreateSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
