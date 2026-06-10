import { OAuth2Client } from "google-auth-library";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { createAccessToken, createRefreshToken } from "./auth";
import { hashPassword } from "./auth";
import type { Context } from "hono";
import { logger } from "./logger";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

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

export function createGoogleAuthUrl() {
  if (!env.googleClientId) {
    throw new Error("Google OAuth is not configured");
  }

  const state = crypto.randomUUID();

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

export async function handleGoogleCallback(c: Context) {
  const code = c.req.query("code");
  const error = c.req.query("error");

  if (error) {
    logger.warn("Google OAuth error", { error });
    return c.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }

  if (!code) {
    return c.redirect(`${env.frontendUrl}/login?error=no_code`);
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

    const tokenPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    return c.redirect(
      `${env.frontendUrl}/oauth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`
    );
  } catch (err: any) {
    logger.error("Google OAuth callback error", { error: err.message });
    return c.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }
}
