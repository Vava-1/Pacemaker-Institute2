import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "../queries/db";
import { users } from "../../db/schema";
import type { User } from "../../db/schema";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "your-super-secret-key-min-32-chars-long!!"
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "your-super-secret-key-min-32-chars-long!!"
);

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  type: "access" | "refresh";
}

// Generate access token (15 minutes)
export async function generateAccessToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

// Generate refresh token (7 days)
export async function generateRefreshToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_REFRESH_SECRET);
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    clockTolerance: 60,
  });
  return payload as unknown as JWTPayload;
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, {
    clockTolerance: 60,
  });
  return payload as unknown as JWTPayload;
}

// Get user from token
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = await verifyAccessToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    return user || null;
  } catch {
    return null;
  }
}

// Generate email verification token
export function generateEmailVerifyToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate password reset token
export function generatePasswordResetToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate OTP code
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
