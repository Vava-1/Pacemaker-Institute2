import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, publicProcedure, authedQuery } from "./trpc";
import { getDb } from "./queries/connection";
import { users, passwordResets } from "@db/schema";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  createPasswordResetToken,
  validatePassword,
} from "./lib/auth";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
} from "./lib/mailer";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "instructor"]).default("user"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const authRouter = createRouter({
  register: publicProcedure
    .input(RegisterSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      
      // Validate password complexity
      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordCheck.errors.join(". "),
        });
      }
      
      // Check existing email
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }
      
      try {
        const passwordHash = await hashPassword(input.password);
        const verificationToken = crypto.randomUUID();
        
        const [result] = await db.insert(users).values({
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          emailVerified: false,
          emailVerifyToken: verificationToken,
        });
        
        const userId = Number(result.insertId);
        
        // Generate and store OTP
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, userId));
        
        // Send OTP email
        sendOtpEmail(input.email, input.name, otp).catch((err) =>
          logger.error("Failed to send OTP email", { error: err, email: input.email })
        );
        
        sendWelcomeEmail(input.email, input.name).catch((err) =>
          logger.error("Failed to send welcome email", { error: err, email: input.email })
        );
        
        logger.info("User registered", { userId, email: input.email, role: input.role });
        
        return { 
          success: true, 
          userId, 
          message: "Registration successful. Please check your email for the OTP code to verify your account.",
          ...(env.isDevelopment ? { devOtp: otp } : {}),
        };
      } catch (err: any) {
        logger.error("Registration failed", { error: err.message, email: input.email });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed. Please try again." });
      }
    }),

  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userRows[0];
      
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      
      if (user.isSuspended) {
        logger.warn("Suspended user login attempt", { userId: user.id });
        throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended. Please contact support." });
      }
      
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      
      const tokenPayload = { sub: user.id, email: user.email, name: user.name ?? '', role: user.role };
      const accessToken = await createAccessToken(tokenPayload);
      const refreshToken = await createRefreshToken(tokenPayload);
      
      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
      
      logger.info("User logged in", { userId: user.id });
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      };
    }),

  refresh: publicProcedure
    .input(RefreshTokenSchema)
    .mutation(async ({ input }) => {
      const payload = await verifyRefreshToken(input.refreshToken);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired refresh token" });
      }
      
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      const user = userRows[0];
      
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
      }
      
      if (user.isSuspended) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });
      }
      
      const tokenPayload = { sub: user.id, email: user.email, name: user.name ?? '', role: user.role };
      const accessToken = await createAccessToken(tokenPayload);
      const refreshToken = await createRefreshToken(tokenPayload);
      
      logger.info("Tokens refreshed", { userId: user.id });
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      };
    }),

  forgotPassword: publicProcedure
    .input(ForgotPasswordSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (userRows.length > 0) {
        const user = userRows[0];
        const resetToken = await createPasswordResetToken(user.id, user.email);
        
        await db.insert(passwordResets).values({
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000),
        });
        
        sendPasswordResetEmail(user.email, user.name ?? 'User', resetToken).catch((err) =>
          logger.error("Failed to send password reset email", { error: err })
        );
      }
      
      // Always return same message to prevent email enumeration
      return { message: "If an account with that email exists, a password reset link has been sent." };
    }),

  resetPassword: publicProcedure
    .input(ResetPasswordSchema)
    .mutation(async ({ input }) => {
      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordCheck.errors.join(". "),
        });
      }
      
      const tokenData = await verifyPasswordResetToken(input.token);
      if (!tokenData) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
      }
      
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, tokenData.userId)).limit(1);
      if (userRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      
      const passwordHash = await hashPassword(input.password);
      await db.update(users).set({ passwordHash }).where(eq(users.id, tokenData.userId));
      
      logger.info("Password reset completed", { userId: tokenData.userId });
      
      return { message: "Password has been reset successfully. You can now log in with your new password." };
    }),

  changePassword: authedQuery
    .input(ChangePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const user = userRows[0];
      
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      
      const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect" });
      }
      
      const passwordCheck = validatePassword(input.newPassword);
      if (!passwordCheck.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordCheck.errors.join(". "),
        });
      }
      
      const newHash = await hashPassword(input.newPassword);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));
      
      logger.info("Password changed", { userId: ctx.user.id });
      
      return { message: "Password changed successfully" };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.emailVerifyToken, input.token)).limit(1);
      
      if (userRows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification token" });
      }
      
      await db.update(users).set({
        emailVerified: true,
        emailVerifyToken: null,
      }).where(eq(users.id, userRows[0].id));
      
      logger.info("Email verified", { userId: userRows[0].id });
      
      return { message: "Email verified successfully" };
    }),

  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (userRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      
      const user = userRows[0];
      
      if (user.emailVerified) {
        return { message: "Email already verified" };
      }
      
      if (!user.otpCode || !user.otpExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No OTP code found. Please request a new one." });
      }
      
      if (new Date() > new Date(user.otpExpiresAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "OTP code has expired. Please request a new one." });
      }
      
      if (user.otpCode !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid OTP code" });
      }
      
      await db.update(users).set({
        emailVerified: true,
        emailVerifyToken: null,
        otpCode: null,
        otpExpiresAt: null,
      }).where(eq(users.id, user.id));
      
      logger.info("Email verified via OTP", { userId: user.id });
      
      return { message: "Email verified successfully" };
    }),

  resendOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (userRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      
      const user = userRows[0];
      
      if (user.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email already verified" });
      }
      
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, user.id));
      
      sendOtpEmail(user.email, user.name ?? 'User', otp).catch((err) =>
        logger.error("Failed to resend OTP email", { error: err, email: user.email })
      );
      
      logger.info("OTP resent", { userId: user.id });
      
      return { 
        message: "OTP sent successfully",
        ...(env.isDevelopment ? { devOtp: otp } : {}),
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const db = getDb();
    const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    if (userRows.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }
    
    return userRows[0];
  }),
});
