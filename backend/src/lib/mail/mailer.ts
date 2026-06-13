import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

/**
 * Mail transport, chosen by `EMAIL_PROVIDER`:
 *   - "gmail"  → Gmail SMTP with an app password (GMAIL_USER / GMAIL_APP_PASSWORD)
 *   - "resend" → Resend's SMTP relay (user "resend", pass = RESEND_API_KEY)
 * When no provider is configured it falls back to a JSON transport that logs
 * the message (dev) so flows stay testable without a mail server. Sending never
 * throws into the caller's happy path — failures are logged and swallowed
 * (callers shouldn't 500 because email is down).
 */

let cached: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (cached) return cached;

  if (env.SMTP_HOST) {
    // Generic SMTP — works with any server (incl. Gmail / Resend).
    cached = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  } else if (env.mailEnabled && env.EMAIL_PROVIDER === "gmail") {
    cached = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  } else if (env.mailEnabled && env.EMAIL_PROVIDER === "resend") {
    cached = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: env.RESEND_API_KEY },
    });
  } else {
    cached = nodemailer.createTransport({ jsonTransport: true });
  }
  return cached;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!env.mailEnabled) {
    if (!env.EMAIL_DEV_FALLBACK) {
      console.warn(`[mail] no email provider configured — skipping "${message.subject}" to ${message.to}`);
      return;
    }
    console.log(`[mail] (dev fallback — no provider) → ${message.to} · "${message.subject}"`);
  }

  try {
    await getTransport().sendMail({ from: env.mailFrom, ...message });
  } catch (error) {
    console.error("[mail] failed to send:", error);
  }
}
