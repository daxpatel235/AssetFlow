import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Typed HTTP error thrown from route handlers/services.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
  static badRequest = (m = 'Bad request', f?: Record<string, string>) => new ApiError(400, m, f);
  static unauthorized = (m = 'Unauthorized') => new ApiError(401, m);
  static forbidden = (m = 'Forbidden') => new ApiError(403, m);
  static notFound = (m = 'Not found') => new ApiError(404, m);
  static conflict = (m = 'Conflict') => new ApiError(409, m);
}

// Normalize any thrown value into a JSON response. Zod → 400 with field errors,
// ApiError → its status, anything else → 500 (reported to Sentry).
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fieldErrors = Object.fromEntries(err.errors.map((e) => [e.path.join('.') || '_', e.message]));
    return NextResponse.json({ message: 'Validation failed', errors: fieldErrors }, { status: 400 });
  }
  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message, errors: err.fieldErrors }, { status: err.status });
  }
  console.error(err);
  Sentry.captureException(err);
  return NextResponse.json({ message: 'Server error' }, { status: 500 });
}

// Wrap a route handler so thrown errors become clean JSON automatically,
// and apply default caching for GET requests to improve backend responsiveness.
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      const res = await fn(...args);
      const req = args[0] as Request | undefined;
      if (req && req.method === 'GET' && res.ok && !res.headers.has('Cache-Control')) {
        res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
      }
      return res;
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
