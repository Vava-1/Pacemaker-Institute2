import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, publicProcedure, authedQuery } from "./trpc";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
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
} from "./lib/mailer";
import { consumeOAuthCode } from "./lib/google-auth";

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

        const [result] = await db.insert(users).values({
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          emailVerified: true,  // Auto-verified — no OTP needed
        });

        const userId = Number(result.insertId);

        // Send welcome email (fire and forget)
        sendWelcomeEmail(input.email, input.name).catch((err) =>
          logger.error("Failed to send welcome email", { error: err, email: input.email })
        );

        logger.info("User registered", { userId, email: input.email, role: input.role });

        return { 
          success: true, 
          userId, 
          message: "Registration successful. You can now log in.",
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

      // REMOVED: Email verification check — users can log in immediately

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const tokenPayload = { id: user.id, sub: user.id, email: user.email, name: user.name ?? '', role: user.role };
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
      const userRows = await db.select().from(users).where(eq(users.id, Number(payload.sub))).limit(1);
      const user = userRows[0];

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
      }

      if (user.isSuspended) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });
      }

      const tokenPayload = { id: user.id, sub: user.id, email: user.email, name: user.name ?? '', role: user.role };
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
        // createPasswordResetToken persists the SHA-256 hash to the DB
        // and returns the raw token for the email link.
        const resetToken = await createPasswordResetToken(user.id);

        sendPasswordResetEmail(user.email, user.name ?? 'User', resetToken).catch((err) =>
          logger.error("Failed to send password reset email", { error: err })
        );
      }

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

  // REMOVED: verifyEmail — no longer needed
  // REMOVED: verifyOtp — no longer needed
  // REMOVED: resendOtp — no longer needed

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const db = getDb();
    const userRows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      role: users.role,
      emailVerified: users.emailVerified,
      isSuspended: users.isSuspended,
      nativeLanguage: users.nativeLanguage,
      learningLanguages: users.learningLanguages,
      totalPoints: users.totalPoints,
      weeklyPoints: users.weeklyPoints,
      monthlyPoints: users.monthlyPoints,
      accuracyPercent: users.accuracyPercent,
      rankTier: users.rankTier,
      longestStreak: users.longestStreak,
      lastSubmissionDate: users.lastSubmissionDate,
      studyStreak: users.studyStreak,
      totalStudyMinutes: users.totalStudyMinutes,
      referralCode: users.referralCode,
      isOnline: users.isOnline,
      googleId: users.googleId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignInAt: users.lastSignInAt,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (userRows.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return userRows[0];
  }),

  /**
   * Exchange the one-time code from the Google OAuth callback redirect
   * for the actual JWT pair. This keeps tokens out of the URL — the
   * callback only redirects with `?code=...`, which the frontend then
   * swaps here.
   */
  exchangeOAuthCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const tokens = consumeOAuthCode(input.code);
      if (!tokens) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired OAuth code" });
      }
      return tokens;
    }),
});
