import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validation';
import { route } from '@/lib/api-error';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { sendMail } from '@/lib/mailer';

const RESET_TTL_MS = 60 * 60 * 1000; // reset links are valid for 1 hour
const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

// Base URL for the reset link. Prefer the request's own origin so it works on
// any host/port without extra config; APP_URL overrides when set.
function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const host = req.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

// POST /api/auth/forgot-password
export const POST = route(async (req: Request) => {
  rateLimit(`forgot:${clientIp(req)}`, { max: 10 });
  const { email } = forgotPasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });

  // Only actually issue a token for a real, active account — but ALWAYS respond
  // the same way below, so an attacker can't use this endpoint to discover which
  // emails are registered (no user-enumeration leak).
  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashToken(rawToken), resetTokenExpires: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${baseUrl(req)}/reset-password?token=${rawToken}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your password',
      text:
        `Hi ${user.name || 'there'},\n\n` +
        `We received a request to reset your password. Open the link below to choose a new one — it expires in 1 hour:\n\n` +
        `${link}\n\n` +
        `If you didn't request this, you can safely ignore this email.`,
    });
  }

  return NextResponse.json({ message: 'If that email is registered, a reset link is on its way.' });
});
