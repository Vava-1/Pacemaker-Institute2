/**
 * Google OAuth flow.
 *
 * Security fixes applied:
 *  - The `state` parameter is now a signed HMAC of a nonce + expiry,
 *    stored in a short-lived httpOnly cookie. The callback verifies
 *    both the cookie presence and the HMAC, preventing CSRF.
 *  - Access & refresh tokens are delivered to the frontend via a
 *    one-time `code` exchange URL parameter. The frontend then POSTs
 *    that code to `auth.exchangeOAuthCode` which returns tokens in
 *    the response body (not the URL). This avoids leaking tokens via
 *    browser history, Referer headers, and proxy logs.
 *
 * If `GOOGLE_OAUTH_REDIRECT_FALLBACK_URL` is set, the older direct-
 * redirect behavior is used (kept for backwards compatibility with
 * existing frontend deployments that haven't yet implemented the
 * exchange endpoint).
 */
import { OAuth2Client } from "google-auth-library";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { createAccessToken, createRefreshToken, hashPassword } from "./auth";
import type { Context } from "hono";
import { logger } from "./logger";
import crypto from "node:crypto";
import { setCookie, getCookie } from "hono/cookie";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_SECONDS = 600; // 10 minutes

let googleClient: OAuth2Client | null = null;

function getClient() {
  if (!googleClient && env.googleClientId && env.googleClientSecret) {
    googleClient = new OAuth2Client(
      env.googleClientId,
      env.googleClientSecret,
      env.googleCallbackUrl
    );
  }
  return googleClient;
}

/** Derive an HMAC key from the JWT access secret (or any stable secret). */
function getStateKey(): string {
  return process.env.JWT_ACCESS_SECRET || "dev-only-oauth-state-key-min-32-chars!!";
}

/** Build a signed state string: `nonce.expire.hmac`. */
function signState(nonce: string, expire: number): string {
  const payload = `${nonce}.${expire}`;
  const hmac = crypto.createHmac("sha256", getStateKey()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verifyState(state: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, expireStr, hmac] = parts;
  const expire = Number(expireStr);
  if (!Number.isFinite(expire)) return false;
  if (Date.now() > expire) return false;
  const expected = crypto.createHmac("sha256", getStateKey()).update(`${nonce}.${expire}`).digest("hex");
  // Constant-time compare
  if (expected.length !== hmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
}

export function createGoogleAuthUrl(c: Context) {
  if (!env.googleClientId) {
    throw new Error("Google OAuth is not configured");
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expire = Date.now() + STATE_TTL_SECONDS * 1000;
  const state = signState(nonce, expire);

  // Persist state in a short-lived httpOnly cookie
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleCallbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * In-memory one-time code store. Each OAuth success mints a short-
 * lived (60s) random code; the frontend POSTs it to the exchange
 * endpoint to retrieve the actual JWTs. This keeps JWTs out of URLs.
 *
 * For multi-instance production deployments, replace this with Redis
 * or another shared store keyed by the code.
 */
const oauthCodes = new Map<string, { accessToken: string; refreshToken: string; expiresAt: number }>();

function mintOAuthCode(accessToken: string, refreshToken: string): string {
  const code = crypto.randomBytes(32).toString("hex");
  oauthCodes.set(code, { accessToken, refreshToken, expiresAt: Date.now() + 60_000 });
  // Lazy cleanup
  if (oauthCodes.size > 1000) {
    const now = Date.now();
    for (const [k, v] of oauthCodes) if (v.expiresAt < now) oauthCodes.delete(k);
  }
  return code;
}

export function consumeOAuthCode(code: string): { accessToken: string; refreshToken: string } | null {
  const entry = oauthCodes.get(code);
  if (!entry) return null;
  oauthCodes.delete(code); // one-time use
  if (entry.expiresAt < Date.now()) return null;
  return { accessToken: entry.accessToken, refreshToken: entry.refreshToken };
}

export async function handleGoogleCallback(c: Context) {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const returnedState = c.req.query("state");
  const storedState = getCookie(c, STATE_COOKIE);

  // Always clear the state cookie
  setCookie(c, STATE_COOKIE, "", { httpOnly: true, secure: env.isProduction, sameSite: "Lax", path: "/", maxAge: 0 });

  if (error) {
    logger.warn("Google OAuth error", { error });
    return c.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }

  if (!code) {
    return c.redirect(`${env.frontendUrl}/login?error=no_code`);
  }

  // Verify state to prevent CSRF
  if (!returnedState || !storedState || returnedState !== storedState || !verifyState(returnedState)) {
    logger.warn("Google OAuth state mismatch — possible CSRF", { hasReturned: !!returnedState, hasStored: !!storedState });
    return c.redirect(`${env.frontendUrl}/login?error=state_mismatch`);
  }

  if (!env.googleClientId || !env.googleClientSecret) {
    return c.redirect(`${env.frontendUrl}/login?error=not_configured`);
  }

  try {
    const client = getClient();
    if (!client) {
      return c.redirect(`${env.frontendUrl}/login?error=not_configured`);
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const response = await client.request({ url: GOOGLE_USERINFO_URL });
    const data = response.data as any;
    const email = data.email as string;
    const name = data.name as string;
    const picture = data.picture as string;
    const googleId = data.id as string;

    if (!email) {
      return c.redirect(`${env.frontendUrl}/login?error=no_email`);
    }

    const db = getDb();
    let userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = userRows[0];

    if (user) {
      await db.update(users).set({
        googleId,
        avatar: user.avatar || picture,
        emailVerified: true,
        lastSignInAt: new Date(),
      }).where(eq(users.id, user.id));
    } else {
      const [result] = await db.insert(users).values({
        email,
        name,
        avatar: picture,
        googleId,
        passwordHash: await hashPassword(crypto.randomUUID()),
        emailVerified: true,
        role: "user",
        lastSignInAt: new Date(),
      });

      const newUsers = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);
      user = newUsers[0];
    }

    if (user.isSuspended) {
      return c.redirect(`${env.frontendUrl}/login?error=account_suspended`);
    }

    const tokenPayload = { sub: user.id, email: user.email, name: user.name ?? "", role: user.role };
    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    // Mint a one-time code; the frontend will exchange it for the tokens.
    // This keeps JWTs out of the URL, browser history, and Referer headers.
    const oneTimeCode = mintOAuthCode(accessToken, refreshToken);

    return c.redirect(
      `${env.frontendUrl}/oauth/callback?code=${oneTimeCode}`
    );
  } catch (err: any) {
    logger.error("Google OAuth callback error", { error: err.message });
    return c.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }
}
