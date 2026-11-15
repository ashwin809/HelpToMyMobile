import nodemailer from 'nodemailer';

const smtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !from) {
    return null;
  }
  return { host, port, user, pass, from, secure: process.env.SMTP_SECURE === 'true' };
};

export function isMailConfigured() {
  const config = smtpConfig();
  const publicUrl = process.env.APP_PUBLIC_URL?.trim();
  if (!config || !publicUrl) return false;
  try {
    const url = new URL(publicUrl);
    return ['http:', 'https:'].includes(url.protocol) && (process.env.NODE_ENV !== 'production' || url.protocol === 'https:');
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail({ to, resetUrl, appResetUrl }) {
  const config = smtpConfig();
  if (!config) throw new Error('SMTP is not configured.');

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: 'Reset your HelpToYou password',
      text: [
        'We received a request to reset the password for your HelpToYou account.',
        '',
        `Reset your password in a browser: ${resetUrl}`,
        `Or open the app: ${appResetUrl}`,
        '',
        'This link expires in 30 minutes and can only be used once.',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
      <h1 style="font-size:22px">Reset your HelpToYou password</h1>
      <p>We received a request to reset the password for your account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#00a65a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset password in browser</a></p>
      <p><a href="${appResetUrl}">Open the HelpToYou app</a></p>
      <p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>
    </div>`,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } finally {
    transporter.close();
  }
}
