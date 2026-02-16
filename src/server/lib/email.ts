import { Resend } from "resend";
import { env } from "../env.ts";

const FROM = "ClaudeCare <noreply@claudecare.com>";

const resend = new Resend(env.RESEND_API_KEY);

// --- Password Reset ---

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  console.log(`[email] Password reset for ${to}: ${resetUrl}`);

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your ClaudeCare password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 16px;">Reset your password</h2>
        <p style="color: #6B6B7B; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Someone requested a password reset for your ClaudeCare account. Click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #0D756E; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 500;">
          Reset Password
        </a>
        <p style="color: #6B6B7B; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #E8E3DB; margin: 32px 0 16px;" />
        <p style="color: #A0A0A0; font-size: 12px;">ClaudeCare — AI Wellness Check-Ins</p>
      </div>
    `,
  });
}

// --- Escalation Alerts ---

interface EscalationEmailData {
  personName: string;
  tier: string;
  reason: string;
  details?: string;
  dashboardUrl: string;
}

export async function sendEscalationAlert(to: string[], data: EscalationEmailData) {
  if (to.length === 0) return;

  const tierColor = data.tier === "immediate" ? "#C53030" : data.tier === "urgent" ? "#D69E2E" : "#6B6B7B";
  const tierLabel = data.tier.charAt(0).toUpperCase() + data.tier.slice(1);

  console.log(`[email] Escalation alert (${data.tier}) for ${data.personName} → ${to.join(", ")}`);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[${tierLabel}] Escalation: ${data.personName} — ${data.reason}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: ${tierColor}; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px;">
          ${tierLabel} Escalation
        </div>
        <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 8px;">${data.personName}</h2>
        <p style="color: #1A1A2E; font-size: 15px; font-weight: 500; margin: 0 0 8px;">${data.reason}</p>
        ${data.details ? `<p style="color: #6B6B7B; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">${data.details}</p>` : ""}
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #0D756E; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 500;">
          View in Dashboard
        </a>
        ${data.tier === "immediate" ? `
        <div style="background: #FDE8E8; border: 1px solid #C53030; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="color: #C53030; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Immediate action required</p>
          <p style="color: #6B6B7B; font-size: 13px; margin: 0;">This escalation requires same-day follow-up. If suicidal ideation is indicated, contact 988 Suicide & Crisis Lifeline or 911.</p>
        </div>
        ` : ""}
        <hr style="border: none; border-top: 1px solid #E8E3DB; margin: 32px 0 16px;" />
        <p style="color: #A0A0A0; font-size: 12px;">ClaudeCare — AI Wellness Check-Ins</p>
      </div>
    `,
  });
}
