import "server-only";

// Plain, functional templates -- deliberately undesigned. The real visual
// design is coming separately (see the site's marketing pages, which were
// each built from a supplied design); these exist so the sending logic
// (registration, password reset, account deletion) can be built and tested
// now without waiting on that. Swap the markup inside emailShell/button
// once a design lands -- every template routes through them, so the visual
// pass touches one place, not four.
//
// English only for now: the site is fully bilingual, but wiring a locale
// through the Google OAuth callback (which has no request-scoped locale
// available) is a bigger lift than this first pass covers. Worth doing
// alongside the eventual design pass, not before it.

const BRAND_COLOR = "#4F46E5";
const SITE_URL = "https://bookkeeply.me";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F8FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;">
            <tr>
              <td style="padding:28px 32px 0;">
                <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:${BRAND_COLOR};color:#FFFFFF;font-weight:700;font-size:15px;text-align:center;line-height:28px;">b</span>
                <span style="font-weight:600;font-size:15px;color:#16181D;margin-left:8px;">Bookkeeply</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;color:#16181D;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#8B8FA3;">&copy; ${new Date().getFullYear()} Bookkeeply</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:${BRAND_COLOR};color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

export function welcomeEmail(name: string) {
  const safeName = escapeHtml(name);
  const subject = "Welcome to Bookkeeply";
  const html = emailShell(`
    <h1 style="font-size:19px;margin:0 0 12px;">Welcome, ${safeName}.</h1>
    <p style="margin:0;">Your Bookkeeply account is ready. Add your first transaction and your tax estimate starts updating automatically, no spreadsheets, no guessing.</p>
    ${button(`${SITE_URL}/dashboard`, "Go to your dashboard")}
  `);
  const text = `Welcome, ${name}.\n\nYour Bookkeeply account is ready. Add your first transaction and your tax estimate starts updating automatically.\n\n${SITE_URL}/dashboard`;
  return { subject, html, text };
}

export function passwordResetRequestEmail(resetUrl: string) {
  const subject = "Reset your Bookkeeply password";
  const html = emailShell(`
    <h1 style="font-size:19px;margin:0 0 12px;">Reset your password</h1>
    <p style="margin:0;">Someone asked to reset the password on this Bookkeeply account. If that was you, click below to choose a new one. This link expires in 1 hour.</p>
    ${button(resetUrl, "Reset password")}
    <p style="margin:20px 0 0;font-size:12px;color:#8B8FA3;">If you didn't request this, you can ignore this email, your password won't change.</p>
  `);
  const text = `Someone asked to reset the password on this Bookkeeply account. If that was you, use this link within 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  return { subject, html, text };
}

export function googleOnlyAccountEmail() {
  const subject = "About your Bookkeeply account";
  const html = emailShell(`
    <h1 style="font-size:19px;margin:0 0 12px;">This account signs in with Google</h1>
    <p style="margin:0;">Someone asked to reset the password for this email address, but this Bookkeeply account was created with "Continue with Google" and has no password to reset. Sign in using the Google button on the login page instead.</p>
    ${button(`${SITE_URL}/login`, "Go to login")}
  `);
  const text = `Someone asked to reset the password for this email address, but this Bookkeeply account was created with "Continue with Google" and has no password to reset. Sign in using the Google button instead:\n\n${SITE_URL}/login`;
  return { subject, html, text };
}

export function passwordChangedEmail() {
  const subject = "Your Bookkeeply password was changed";
  const html = emailShell(`
    <h1 style="font-size:19px;margin:0 0 12px;">Your password was changed</h1>
    <p style="margin:0;">This is a confirmation that the password on this Bookkeeply account was just changed. If this was you, no action is needed.</p>
    <p style="margin:16px 0 0;">If you didn't make this change, contact us right away at <a href="mailto:support@bookkeeply.me" style="color:${BRAND_COLOR};">support@bookkeeply.me</a>.</p>
  `);
  const text = `This is a confirmation that the password on this Bookkeeply account was just changed. If this wasn't you, contact support@bookkeeply.me right away.`;
  return { subject, html, text };
}

export function accountDeletedEmail(businessName: string) {
  const safeName = escapeHtml(businessName);
  const subject = "Your Bookkeeply account has been deleted";
  const html = emailShell(`
    <h1 style="font-size:19px;margin:0 0 12px;">Your account has been deleted</h1>
    <p style="margin:0;">This confirms that your Bookkeeply account and business "${safeName}", along with every transaction, reconciliation, and tax record tied to it, have been permanently deleted. There's no undo.</p>
    <p style="margin:16px 0 0;">If you didn't request this, contact us immediately at <a href="mailto:support@bookkeeply.me" style="color:${BRAND_COLOR};">support@bookkeeply.me</a>.</p>
  `);
  const text = `This confirms that your Bookkeeply account and business "${businessName}", along with every transaction, reconciliation, and tax record tied to it, have been permanently deleted. There's no undo.\n\nIf you didn't request this, contact support@bookkeeply.me immediately.`;
  return { subject, html, text };
}
