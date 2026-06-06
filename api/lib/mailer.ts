import nodemailer from "nodemailer";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { platformSettings } from "@db/schema";
import { eq } from "drizzle-orm";

async function getSmtpConfig() {
  const db = getDb();
  const settings = await db.select().from(platformSettings);
  const config = settings.reduce((acc, row) => {
    acc[row.settingKey] = row.settingValue;
    return acc;
  }, {} as Record<string, string | null>);

  return {
    host: config.smtp_host || process.env.SMTP_HOST || "localhost",
    port: parseInt(config.smtp_port || process.env.SMTP_PORT || "587", 10),
    user: config.smtp_user || process.env.SMTP_USER || "",
    pass: config.smtp_password || process.env.SMTP_PASSWORD || "",
    fromName: config.smtp_from_name || process.env.SMTP_FROM_NAME || "Pacemaker Institute",
    fromEmail: config.smtp_from_email || process.env.SMTP_FROM_EMAIL || "noreply@pacemakerinstitute.com",
  };
}

// Simple in‑memory rate limiter: max 5 emails per minute per recipient
const emailRateMap = new Map<string, number[]>();
function isRateLimited(email: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const timestamps = emailRateMap.get(email) || [];
  // Keep only timestamps within the window
  const recent = timestamps.filter(ts => now - ts < windowMs);
  if (recent.length >= 5) {
    return true;
  }
  recent.push(now);
  emailRateMap.set(email, recent);
  return false;
}

export async function sendEmail(to: string, subject: string, html: string) {
  // Rate‑limit check
  if (isRateLimited(to)) {
    console.warn(`[Mailer] Rate limit exceeded for ${to}`);
    return false;
  }

  try {
    const config = await getSmtpConfig();
    
    // In dev, if no SMTP config is found, just log to console
    if (!config.user && !env.isProduction) {
      console.log("-------------------------------------------------------");
      console.log(`MOCK EMAIL SENT TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY: \n${html}`);
      console.log("-------------------------------------------------------");
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Mailer] Error sending email:", error);
    // Don't throw - we don't want to crash the main request if email fails
    return false;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to Pacemaker Institute, ${name}!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Pacemaker Institute</p>
    </div>
  `;
  return sendEmail(email, "Verify your email address", html);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Pacemaker Institute</p>
    </div>
  `;
  return sendEmail(email, "Reset your password", html);
}
