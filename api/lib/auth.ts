import * as jose from "jose";
import { env } from "./env";
import * as cookie from "cookie";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const JWT_ALG = "HS256";

export type SessionPayload = {
  userId: number;
  email: string;
  role: string;
};

export async function signAccessToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtAccessSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("15m") // Short lived access token
    .sign(secret);
}

export async function signRefreshToken(payload: { userId: number }): Promise<string> {
  const secret = new TextEncoder().encode(env.jwtRefreshSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days refresh token
    .sign(secret);
}

export async function verifyToken<T>(token: string, secretStr: string): Promise<T | null> {
  try {
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    return payload as unknown as T;
  } catch (error) {
    return null;
  }
}

export async function authenticateRequest(req: Request, resHeaders: Headers) {
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const accessToken = cookies["access_token"];
  const refreshToken = cookies["refresh_token"];

  if (!accessToken && !refreshToken) {
    return null;
  }

  // 1. Try access token
  if (accessToken) {
    const payload = await verifyToken<SessionPayload>(accessToken, env.jwtAccessSecret);
    if (payload && payload.userId) {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      const user = userRows[0];
      if (user && !user.isSuspended) {
        return user;
      }
    }
  }

  // 2. Access token invalid/expired, try refresh token
  if (refreshToken) {
    const payload = await verifyToken<{ userId: number }>(refreshToken, env.jwtRefreshSecret);
    if (payload && payload.userId) {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      const user = userRows[0];
      
      if (user && !user.isSuspended) {
        // Transparently issue new tokens
        const newAccess = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
        const newRefresh = await signRefreshToken({ userId: user.id });
        
        const cookieOpts = {
          httpOnly: true,
          path: "/",
          sameSite: "lax" as const,
          secure: env.isProduction,
        };

        resHeaders.append("set-cookie", cookie.serialize("access_token", newAccess, { ...cookieOpts, maxAge: 15 * 60 }));
        resHeaders.append("set-cookie", cookie.serialize("refresh_token", newRefresh, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 }));
        
        return user;
      }
    }
  }

  return null;
}
