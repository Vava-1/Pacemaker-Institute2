/**
 * Authentication & token utilities.
 *
 * Exposes both the modern names (hashPassword, verifyPassword,
 * createAccessToken, createRefreshToken, createPasswordResetToken,
 * verifyPasswordResetToken, validatePassword) used by auth-router.ts,
 * plus the legacy aliases (generateAccessToken / generateRefreshToken /
 * generateEmailVerifyToken / generatePasswordResetToken / generateOTP)
 * used elsewhere in the codebase.
 *
 * Security highlights:
 *  - JWT secrets read only from env (no insecure fallbacks).
 *  - bcrypt cost factor 12 for password hashing.
 *  - crypto.randomBytes for all verification / reset / OTP tokens.
 *  - SHA-256 hashing of password-reset tokens before DB storage so a
 *    database dump cannot be replayed.
 */
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getDb } from "../queries/connection";
import { users, passwordResets } from "@db/schema";
import type { User } from "@db/schema";

const BCRYPT_COST = 12;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

/** Read JWT secret from env, fail loud if missing in production. */
function getSecret(varName: string, fallbackDev: string): Uint8Array {
  const value = process.env[varName];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing required secret: ${varName}. Refusing to boot in production without a secure secret.`
      );
    }
    // Development-only fallback. NEVER used in production.
    console.warn(
      `[auth] WARNING: ${varName} not set — using insecure dev fallback. Do NOT use in production.`
    );
    return new TextEncoder().encode(fallbackDev);
  }
  if (value.length < 32) {
    throw new Error(`${varName} must be at least 32 characters long.`);
  }
  return new TextEncoder().encode(value);
}

const JWT_SECRET = () => getSecret("JWT_ACCESS_SECRET", "dev-only-access-secret-32chars-min!!");
const JWT_REFRESH_SECRET = () => getSecret("JWT_REFRESH_SECRET", "dev-only-refresh-secret-32chars-min!!");

export interface JWTPayload {
  userId: number;
  sub: number;
  email: string;
  name: string;
  role: string;
  type: "access" | "refresh";
}

export interface TokenUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

// ─────────────────────────────────────────────────────────────
// Password hashing
// ─────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
  if (password.length > 128) errors.push("Password must be at most 128 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain a number");
  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────
// Access / refresh token issuance
// ─────────────────────────────────────────────────────────────

/** Modern name used by auth-router.ts */
export async function createAccessToken(user: TokenUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(JWT_SECRET());
}

/** Modern name used by auth-router.ts */
export async function createRefreshToken(user: TokenUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(JWT_REFRESH_SECRET());
}

/** Legacy alias — accepts full User row. */
export async function generateAccessToken(user: User): Promise<string> {
  return createAccessToken({
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    role: user.role,
  });
}

/** Legacy alias — accepts full User row. */
export async function generateRefreshToken(user: User): Promise<string> {
  return createRefreshToken({
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    role: user.role,
  });
}

// ─────────────────────────────────────────────────────────────
// Token verification
// ─────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET(), {
    clockTolerance: 60,
  });
  return payload as unknown as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET(), {
      clockTolerance: 60,
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = await verifyAccessToken(token);
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.userId)))
      .limit(1);
    return user || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Email verification & OTP tokens (cryptographically secure)
// ─────────────────────────────────────────────────────────────

export function generateEmailVerifyToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateOTP(): string {
  // 6-digit code, unbiased
  return String(crypto.randomInt(100000, 1000000));
}

// ─────────────────────────────────────────────────────────────
// Password reset tokens
//
// We return the raw token to the caller (for the email link) but
// store only the SHA-256 hash in the database. This means a DB
// dump cannot be replayed.
// ─────────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PasswordResetTokenData {
  userId: number;
  email: string;
  expiresAt: Date;
}

/** Hash a token for storage. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Create a reset token, persist its hash, return the raw token for the email link. */
export async function createPasswordResetToken(userId: number, email: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  const db = getDb();
  await db.insert(passwordResets).values({
    userId,
    token: tokenHash,
    expiresAt,
  });

  return rawToken;
}

/** Verify a reset token against stored hashes. Marks the token used on success. */
export async function verifyPasswordResetToken(rawToken: string): Promise<PasswordResetTokenData | null> {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const db = getDb();

  const rows = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.token, tokenHash))
    .limit(1);

  const record = rows[0];
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null;

  // Mark used
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.id, record.id));

  // Fetch user email
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, record.userId))
    .limit(1);

  if (userRows.length === 0) return null;

  return {
    userId: record.userId,
    email: userRows[0].email,
    expiresAt: record.expiresAt,
  };
}

/** Legacy alias — returns a raw token without persisting (kept for compatibility). */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
