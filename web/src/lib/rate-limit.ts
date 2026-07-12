import { ApiError } from './api-error';

// In-memory fixed-window limiter. Fine for a single instance; back it with
// Redis (e.g. @upstash/ratelimit) for multi-instance production.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so the map can't grow unbounded under a
// stream of unique keys (e.g. spoofed IPs). Every Nth call we sweep — cheap and
// amortized, no timer to leak (Wolf ERP's rateLimiter uses the same trick).
let callsSinceSweep = 0;
const SWEEP_EVERY = 500;
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(key: string, { max = 20, windowMs = 15 * 60 * 1000 } = {}): void {
  const now = Date.now();
  if ((callsSinceSweep += 1) % SWEEP_EVERY === 0) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw new ApiError(429, 'Too many attempts. Please try again later.');
  }
}

// Best-effort client IP from proxy headers.
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
