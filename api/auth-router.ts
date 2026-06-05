import { z } from "zod";
import * as cookie from "cookie";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, passwordResets } from "@db/schema";
import { env } from "./lib/env";
import { signAccessToken, signRefreshToken } from "./lib/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "./lib/mailer";

function setAuthCookies(resHeaders: Headers, access: string, refresh: string) {
  const cookieOpts = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: env.isProduction,
  };
  resHeaders.append(
    "set-cookie",
    cookie.serialize("access_token", access, { ...cookieOpts, maxAge: 15 * 60 }),
  );
  resHeaders.append(
    "set-cookie",
    cookie.serialize("refresh_token", refresh, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 }),
  );
}

function clearAuthCookies(resHeaders: Headers) {
  const cookieOpts = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: env.isProduction,
  };
  resHeaders.append("set-cookie", cookie.serialize("access_token", "", { ...cookieOpts, maxAge: 0 }));
  resHeaders.append("set-cookie", cookie.serialize("refresh_token", "", { ...cookieOpts, maxAge: 0 }));
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  
  logout: authedQuery.mutation(async ({ ctx }) => {
    clearAuthCookies(ctx.resHeaders);
    return { success: true };
  }),

  register: publicQuery
    .input(z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters").max(72),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already exists" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const rawToken = crypto.randomBytes(32).toString("hex");
      const emailVerifyToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      const [result] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        emailVerified: false,
        emailVerifyToken,
        role: "user",
      });

      // Send the unhashed token to the user
      await sendVerificationEmail(input.email, input.name, rawToken);

      return { message: "Check your email to verify your account" };
    }),

  login: publicQuery
    .input(z.object({
      email: z.string().email("Invalid email address"),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userRows[0];

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (user.isSuspended) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended" });
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Please verify your email before logging in" });
      }

      // Record sign in time
      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));

      const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
      const refreshToken = await signRefreshToken({ userId: user.id });

      setAuthCookies(ctx.resHeaders, accessToken, refreshToken);

      return { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          avatar: user.avatar 
        } 
      };
    }),

  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userRows[0];

      if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.insert(passwordResets).values({
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        await sendPasswordResetEmail(user.email, rawToken);
      }

      // Always return success even if user not found (security)
      return { message: "If an account exists, you will receive a password reset email" };
    }),

  resetPassword: publicQuery
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8).max(72),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");
      
      const resetRows = await db.select().from(passwordResets)
        .where(
          and(
            eq(passwordResets.tokenHash, tokenHash),
            isNull(passwordResets.usedAt),
            gt(passwordResets.expiresAt, new Date())
          )
        ).limit(1);

      const resetRequest = resetRows[0];
      if (!resetRequest) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reset link is invalid or expired" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      
      await db.update(users).set({ passwordHash }).where(eq(users.id, resetRequest.userId));
      await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, resetRequest.id));

      return { message: "Password updated. Please log in." };
    }),

  verifyEmail: publicQuery
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");
      
      const userRows = await db.select().from(users).where(eq(users.emailVerifyToken, tokenHash)).limit(1);
      const user = userRows[0];

      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification link" });
      }

      await db.update(users).set({ emailVerified: true, emailVerifyToken: null }).where(eq(users.id, user.id));

      return { message: "Email verified. You can now log in." };
    }),
});
