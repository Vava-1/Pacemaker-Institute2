import nodemailer from "nodemailer";
import { env } from "./env";
import { logger } from "./logger";

let transporterInstance: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter | null {
  if (!env.smtpHost || !env.smtpUser) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: parseInt(env.smtpPort || "587"),
    secure: parseInt(env.smtpPort || "587") === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
    tls: {
      rejectUnauthorized: env.isProduction,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

function getTransporter(): nodemailer.Transporter | null {
  if (!transporterInstance) {
    transporterInstance = createTransporter();
  }
  return transporterInstance;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const transporter = getTransporter();

  if (!transporter) {
    if (!env.isProduction) {
      logger.info("Mock email sent", { to: options.to, subject: options.subject });
      return { success: true };
    }
    logger.warn("SMTP not configured, email not sent", { to: options.to, subject: options.subject });
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const from = `"${env.smtpFromName}" <${env.smtpFromEmail}>`;
    const result = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info("Email sent", { to: options.to, subject: options.subject, messageId: result.messageId });
    return { success: true, messageId: result.messageId };
  } catch (err: any) {
    logger.error("Failed to send email", { error: err.message, to: options.to });
    return { success: false, error: err.message };
  }
}

function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Pacemaker Institute</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        ${content}
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Pacemaker Institute &bull; 123 Education Lane, Tech City, TC 12345</p>
        <p>You received this email because you have an account with Pacemaker Institute.</p>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Welcome to Pacemaker Institute, ${name}!</h2>
    <p style="color: #6b7280; line-height: 1.6;">We're excited to have you on board. Start your learning journey today with thousands of courses designed to help you succeed.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${env.frontendUrl}/courses" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Explore Courses</a>
    </div>
    <p style="color: #6b7280;">Need help? Contact us at ${env.smtpFromEmail}</p>
  `);
  return sendEmail({ to, subject: "Welcome to Pacemaker Institute!", html });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<EmailResult> {
  const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Password Reset Request</h2>
    <p style="color: #6b7280; line-height: 1.6;">Hi ${name},</p>
    <p style="color: #6b7280; line-height: 1.6;">We received a request to reset your password. This link will expire in 1 hour.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
    <p style="color: #6b7280; line-height: 1.6;">If you didn't request this, you can safely ignore this email.</p>
  `);
  return sendEmail({ to, subject: "Reset your password", html });
}

export async function sendVerificationEmail(to: string, name: string, verificationToken: string): Promise<EmailResult> {
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${verificationToken}`;
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Verify Your Email Address</h2>
    <p style="color: #6b7280; line-height: 1.6;">Hi ${name},</p>
    <p style="color: #6b7280; line-height: 1.6;">Please verify your email address to activate your account. This link will expire in 24 hours.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
  `);
  return sendEmail({ to, subject: "Verify your email address", html });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<EmailResult> {
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Your OTP Code</h2>
    <p style="color: #6b7280; line-height: 1.6;">Hi ${name},</p>
    <p style="color: #6b7280; line-height: 1.6;">Use the following code to verify your email address. This code will expire in 10 minutes.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #1f2937; font-family: monospace;">${otp}</div>
    </div>
    <p style="color: #9ca3af; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
  `);
  return sendEmail({ to, subject: "Your OTP Code", html });
}

export async function sendEnrollmentConfirmationEmail(to: string, name: string, courseName: string, courseUrl: string): Promise<EmailResult> {
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Enrollment Confirmed!</h2>
    <p style="color: #6b7280; line-height: 1.6;">Hi ${name},</p>
    <p style="color: #6b7280; line-height: 1.6;">You are now enrolled in <strong>${courseName}</strong>. Start learning today!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${courseUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Learning</a>
    </div>
  `);
  return sendEmail({ to, subject: `Enrolled in ${courseName}`, html });
}

export async function sendCertificateEmail(to: string, name: string, courseName: string, certificateUrl: string): Promise<EmailResult> {
  const html = getEmailTemplate(`
    <h2 style="color: #1f2937;">Congratulations, ${name}!</h2>
    <p style="color: #6b7280; line-height: 1.6;">You have successfully completed <strong>${courseName}</strong>. Your certificate is ready!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${certificateUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Certificate</a>
    </div>
  `);
  return sendEmail({ to, subject: `Certificate: ${courseName}`, html });
}

export async function sendEmailWithRetry(
  to: string,
  subject: string,
  body: string,
  maxRetries = 3,
): Promise<EmailResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await sendEmail({ to, subject, html: body });
      if (result.success) return result;
    } catch (err: any) {
      logger.warn(`Email attempt ${i + 1} failed`, { error: err.message });
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }

  logger.error("Email failed after all retries", { to, subject });

  if (!env.isProduction) {
    logger.info(`[DEV EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
  }

  return { success: false, error: "Email service temporarily unavailable" };
}

export async function checkSmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured" };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
