import { z } from "zod";

// ===== AUTH CONTRACTS =====

export const loginInput = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginInput>;

export const registerInput = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "instructor"]).default("student"),
});

export type RegisterInput = z.infer<typeof registerInput>;

export const verifyEmailInput = z.object({
  token: z.string().min(1, "Token is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInput>;

export const forgotPasswordInput = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>;

export const resetPasswordInput = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;

export const changePasswordInput = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInput>;

// Auth response types
export const authUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.enum(["student", "instructor", "admin"]),
  emailVerified: z.boolean(),
  totalPoints: z.number(),
  rankTier: z.string(),
  studyStreak: z.number(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshTokenInput = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenInput>;
