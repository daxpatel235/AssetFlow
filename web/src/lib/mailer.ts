import 'server-only';

// Minimal outbound-email abstraction (Wolf ERP pattern). With no SMTP provider
// wired, it logs the message to the server console so flows like password reset
// are fully testable offline with zero paid dependencies. To send for real,
// swap the body of `deliver()` for nodemailer/Resend/SES — callers don't change.

export type Mail = { to: string; subject: string; text: string; html?: string };

const mailerConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

async function deliver(mail: Mail): Promise<void> {
  // --- Real delivery goes here when SMTP_* is configured. ---
  // Kept as a console fallback so the app works offline out of the box.
  console.info(
    [
      '',
      '📧  ────────────────────  OUTBOUND EMAIL (console fallback)  ────────────────────',
      `    To:      ${mail.to}`,
      `    Subject: ${mail.subject}`,
      '    ---',
      mail.text
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n'),
      '    ─────────────────────────────────────────────────────────────────────────────',
      '',
    ].join('\n')
  );
}

export async function sendMail(mail: Mail): Promise<void> {
  try {
    await deliver(mail);
  } catch (err) {
    // Never let a mail failure break the request that triggered it.
    console.error('sendMail failed:', err);
  }
}

export const emailEnabled = mailerConfigured;
