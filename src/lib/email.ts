import "server-only";
import { Resend } from "resend";

// System/transactional mail (welcome, password reset, account deleted) all
// comes from this address, distinct from contact@ (the contact form's
// sender) and support@ (the inbox that receives contact form messages) --
// see contact-actions.ts.
const SYSTEM_FROM = "Bookkeeply <no-reply@bookkeeply.me>";

/**
 * Fire-and-forget system email. Never throws -- a failed welcome email
 * shouldn't fail registration, a failed deletion notice shouldn't block
 * account deletion, etc. Errors are logged, not surfaced to the caller.
 */
export async function sendSystemEmail(params: { to: string; subject: string; html: string; text: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error(`[email] RESEND_API_KEY not set -- skipped "${params.subject}" to ${params.to}`);
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: SYSTEM_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      console.error(`[email] Failed to send "${params.subject}" to ${params.to}:`, error);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${params.subject}" to ${params.to}:`, err);
  }
}
