import { z } from "zod";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "../queries/db";
import { users, passwordResets } from "../../db/schema";
import type { User } from "../../db/schema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerifyToken,
  generatePasswordResetToken,
  generateOTP,
} from "../lib/auth";
import { sendEmail } from "../lib/mailer";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

// ===== AUTH ROUTER =====

export const authRouter = router({
  // ===== REGISTER =====
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["student", "instructor"]).default("student"),
      })
    )
    .mutation(async ({ input }) => {
      const { name, email, password, role } = input;

      // Check if email already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists. Please sign in instead.",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate email verification token
      const emailVerifyToken = generateEmailVerifyToken();

      // Insert user
      const [newUser] = await db.insert(users).values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        emailVerifyToken,
        emailVerified: false,
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        accuracyPercent: 0,
        studyStreak: 0,
        longestStreak: 0,
        totalStudyMinutes: 0,
      });

      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }

      // Fetch the created user
      const [createdUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (!createdUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve created user.",
        });
      }

      // Send verification email
      try {
        const verifyUrl = `${process.env.FRONTEND_URL || "https://pacemakerinstitute.com"}/verify-email?token=${emailVerifyToken}`;
        await sendEmail({
          to: createdUser.email,
          subject: "Verify Your Email - Pacemaker Institute",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Welcome to Pacemaker Institute!</h2>
              <p>Hi ${createdUser.name || "there"},</p>
              <p>Thank you for creating your account as a <strong>${role}</strong>.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 12px;">Pacemaker Institute - AI-Powered Learning Platform</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Don't fail registration if email fails - user can request resend
      }

      return {
        success: true,
        message: "Account created successfully! Please check your email to verify your account before signing in.",
        userId: createdUser.id,
        role: createdUser.role,
      };
    }),

  // ===== LOGIN =====
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;
      const normalizedEmail = email.toLowerCase().trim();

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      // CRITICAL: If user does NOT exist, return clear message
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You don't have an account. Create your account to continue.",
        });
      }

      // Check if account is suspended
      if (user.isSuspended) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account has been suspended. Please contact support.",
        });
      }

      // Check if user has a password (OAuth-only accounts)
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account was created with Google Sign-In. Please use that method to sign in.",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password. Please try again.",
        });
      }

      // Check email verification
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before logging in. Check your inbox for the verification link.",
        });
      }

      // Update last sign in
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));

      // Generate tokens
      const accessToken = await generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
          totalPoints: user.totalPoints,
          rankTier: user.rankTier,
          studyStreak: user.studyStreak,
        },
        accessToken,
        refreshToken,
      };
    }),

  // ===== REFRESH TOKEN =====
  refresh: publicProcedure
    .input(
      z.object({
        refreshToken: z.string().min(1, "Refresh token is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { refreshToken } = input;

      let payload;
      try {
        payload = await verifyRefreshToken(refreshToken);
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token. Please sign in again.",
        });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user || user.isSuspended) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or account suspended.",
        });
      }

      const newAccessToken = await generateAccessToken(user);
      const newRefreshToken = await generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
          totalPoints: user.totalPoints,
          rankTier: user.rankTier,
          studyStreak: user.studyStreak,
        },
      };
    }),

  // ===== VERIFY EMAIL =====
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { token } = input;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerifyToken, token))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired verification token.",
        });
      }

      if (user.emailVerified) {
        return {
          success: true,
          message: "Email is already verified. You can sign in now.",
          role: user.role,
        };
      }

      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerifyToken: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Email verified successfully! You can now sign in.",
        role: user.role,
      };
    }),

  // ===== RESEND VERIFICATION EMAIL =====
  resendVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;
      const normalizedEmail = email.toLowerCase().trim();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this email.",
        });
      }

      if (user.emailVerified) {
        return {
          success: true,
          message: "Email is already verified.",
        };
      }

      // Generate new token
      const newToken = generateEmailVerifyToken();
      await db
        .update(users)
        .set({ emailVerifyToken: newToken })
        .where(eq(users.id, user.id));

      // Send email
      try {
        const verifyUrl = `${process.env.FRONTEND_URL || "https://pacemakerinstitute.com"}/verify-email?token=${newToken}`;
        await sendEmail({
          to: user.email,
          subject: "Verify Your Email - Pacemaker Institute",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Email Verification</h2>
              <p>Hi ${user.name || "there"},</p>
              <p>Here is your new verification link:</p>
              <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email. Please try again later.",
        });
      }

      return {
        success: true,
        message: "Verification email sent! Please check your inbox.",
      };
    }),

  // ===== FORGOT PASSWORD =====
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;
      const normalizedEmail = email.toLowerCase().trim();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: "If an account exists with this email, you will receive a password reset link.",
        };
      }

      const token = generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await db.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt,
      });

      try {
        const resetUrl = `${process.env.FRONTEND_URL || "https://pacemakerinstitute.com"}/reset-password?token=${token}`;
        await sendEmail({
          to: user.email,
          subject: "Password Reset - Pacemaker Institute",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Password Reset Request</h2>
              <p>Hi ${user.name || "there"},</p>
              <p>You requested a password reset. Click the button below to reset your password:</p>
              <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
              <p>This link expires in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }

      return {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      };
    }),

  // ===== RESET PASSWORD =====
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { token, password } = input;

      const [reset] = await db
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.token, token))
        .limit(1);

      if (!reset || reset.usedAt || new Date() > reset.expiresAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, reset.userId));

      await db
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, reset.id));

      return {
        success: true,
        message: "Password reset successfully! You can now sign in with your new password.",
      };
    }),

  // ===== CHANGE PASSWORD (Authenticated) =====
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;
      const userId = ctx.user.userId;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect.",
        });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Password changed successfully.",
      };
    }),

  // ===== GET CURRENT USER =====
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found.",
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      totalPoints: user.totalPoints,
      rankTier: user.rankTier,
      studyStreak: user.studyStreak,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      isOnline: user.isOnline,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    };
  }),

  // ===== LOGOUT =====
  logout: protectedProcedure.mutation(async () => {
    // Client should clear tokens from storage
    // Server-side token blacklisting can be added here if needed
    return {
      success: true,
      message: "Logged out successfully.",
    };
  }),
});
