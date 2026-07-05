import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

/**
 * Mail delivery, chosen by `EMAIL_PROVIDER`:
 *   - "resend" → Resend's HTTPS API (port 443). Preferred over SMTP because many
 *     hosts (Railway, Render, Fly, …) block outbound SMTP ports (25/465/587), which
 *     makes SMTP time out in production while working locally. HTTPS is never blocked.
 *   - "gmail"  → Gmail SMTP with an app password (GMAIL_USER / GMAIL_APP_PASSWORD).
 *   - SMTP_HOST set → generic SMTP (any server). Takes precedence if you explicitly
 *     want SMTP even for Resend (smtp.resend.com).
 * When no provider is configured it falls back to a JSON transport that logs the
 * message (dev) so flows stay testable. Sending never throws into the caller's
 * happy path — failures are logged and swallowed (callers shouldn't 500 because
 * email is down).
 */

let cached: nodemailer.Transporter | null = null;

/** True when we should deliver via Resend's HTTP API rather than SMTP. */
function useResendApi(): boolean {
  return env.EMAIL_PROVIDER === "resend" && !!env.RESEND_API_KEY && !env.SMTP_HOST;
}

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
  } else {
    cached = nodemailer.createTransport({ jsonTransport: true });
  }
  return cached;
}

/** Deliver one message through Resend's HTTP API. Throws on non-2xx. */
async function sendViaResendApi(message: MailMessage): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    // Don't let a slow API hang the request that triggered the email.
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API responded ${res.status}: ${body}`);
  }
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
    if (useResendApi()) {
      await sendViaResendApi(message);
    } else {
      await getTransport().sendMail({ from: env.mailFrom, ...message });
    }
  } catch (error) {
    console.error("[mail] failed to send:", error);
  }
}
