import * as jose from "jose";
// @ts-expect-error bcryptjs has no types
import bcrypt from "bcryptjs";
import { env } from "./env";

const JWT_ALG = "HS256";
const SALT_ROUNDS = 12;

export interface TokenPayload {
  sub: number;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtAccessSecret);
  return new jose.SignJWT({ ...payload, sub: String(payload.sub) })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function createRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtRefreshSecret);
  return new jose.SignJWT({ ...payload, sub: String(payload.sub) })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.jwtAccessSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.jwtRefreshSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  path: string;
}

export function getAccessTokenCookieConfig(): CookieConfig {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  };
}

export function getRefreshTokenCookieConfig(): CookieConfig {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth/refresh",
  };
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain a special character");
  return { valid: errors.length === 0, errors };
}

export async function createPasswordResetToken(userId: number, email: string): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtAccessSecret + "_reset");
  return new jose.SignJWT({ sub: String(userId), email, type: "password_reset" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function verifyPasswordResetToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(env.jwtAccessSecret + "_reset");
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const data = payload as any;
    if (data.type !== "password_reset") return null;
    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
}
