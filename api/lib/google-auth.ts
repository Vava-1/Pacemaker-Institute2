import { OAuth2Client } from "google-auth-library";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken, signRefreshToken } from "./auth";
import * as cookie from "cookie";
import type { Context } from "hono";

// We'll lazy load this to avoid issues if env vars are missing
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
  const client = getClient();
  if (!client) {
    throw new Error("Google OAuth is not configured");
  }
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "consent",
  });
}

export async function handleGoogleCallback(c: Context) {
  const client = getClient();
  if (!client) {
    return c.json({ error: "Google OAuth is not configured" }, 500);
  }

  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "No code provided" }, 400);
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const response = await client.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
    
    const data = response.data as any;
    const email = data.email;
    const name = data.name;
    const picture = data.picture;
    const googleId = data.id;

    if (!email) {
      return c.json({ error: "Could not get email from Google" }, 400);
    }

    const db = getDb();
    
    // Check if user exists
    let userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = userRows[0];

    if (user) {
      // Update google ID and avatar if needed
      await db.update(users).set({
        googleId,
        avatar: user.avatar || picture,
        emailVerified: true, // Google verifies emails
        lastSignInAt: new Date(),
      }).where(eq(users.id, user.id));
    } else {
      // Create new user
      const [insertResult] = await db.insert(users).values({
        email,
        name,
        avatar: picture,
        googleId,
        emailVerified: true,
        role: "user",
        lastSignInAt: new Date(),
      });
      
      const newUsers = await db.select().from(users).where(eq(users.id, insertResult.insertId)).limit(1);
      user = newUsers[0];
    }

    if (user.isSuspended) {
      return c.redirect(`${env.frontendUrl}/login?error=account_suspended`);
    }

    // Sign tokens
    const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ userId: user.id });

    const cookieOpts = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: env.isProduction,
    };

    c.header("set-cookie", cookie.serialize("access_token", accessToken, { ...cookieOpts, maxAge: 15 * 60 }), { append: true });
    c.header("set-cookie", cookie.serialize("refresh_token", refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 }), { append: true });

    return c.redirect(`${env.frontendUrl}/dashboard`);
  } catch (error) {
    console.error("Google OAuth Error:", error);
    return c.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }
}
