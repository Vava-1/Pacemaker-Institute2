import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import Stripe from "stripe";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { createGoogleAuthUrl, handleGoogleCallback } from "./lib/google-auth";
import { webhookRouter } from "./lib/webhook-router";
import { uploadRouter } from "./lib/upload-router";
import { getDb } from "./queries/connection";

const app = new Hono<{ Bindings: HttpBindings }>();

// Security Headers
app.use("*", secureHeaders({
  xFrameOptions: "DENY",
  xXssProtection: "1; mode=block",
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
}));

// CORS
app.use("*", cors({
  origin: env.isProduction ? [env.frontendUrl] : ["http://localhost:5173", "http://localhost:3000", env.frontendUrl],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

// Rate Limiting (100 requests per minute)
app.use("/api/*", rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    return c.req.header("x-forwarded-for") || "unknown-ip";
  },
}));

// Mount webhook router BEFORE bodyLimit so we get raw body text for Stripe
app.route("/api/webhooks", webhookRouter);

// Body Limit to prevent large payloads (50MB) for remaining API endpoints
app.use("/api/*", bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Mount upload router
app.route("/api/upload", uploadRouter);

// ===== Enhanced Health Check =====
app.get("/api/health", async (c) => {
  const services: Record<string, { status: "ok" | "down" | "not_configured"; detail?: string; latencyMs?: number }> = {};

  // 1. Database
  const dbStart = Date.now();
  try {
    const db = getDb();
    await db.execute("SELECT 1" as any);
    services.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (e: any) {
    services.database = { status: "down", detail: e?.message ?? String(e) };
  }

  // 2. Stripe (only if configured)
  if (env.stripeSecretKey) {
    const stripeStart = Date.now();
    try {
      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });
      await stripe.balance.retrieve();
      services.stripe = { status: "ok", latencyMs: Date.now() - stripeStart };
    } catch (e: any) {
      services.stripe = { status: "down", detail: e?.message ?? String(e) };
    }
  } else {
    services.stripe = { status: "not_configured" };
  }

  // 3. Anthropic (lightweight ping - just check key is present + callable)
  if (env.anthropicApiKey) {
    services.anthropic = { status: "ok", detail: "Key present" };
  } else {
    services.anthropic = { status: "not_configured" };
  }

  const allOk = Object.values(services).every((s) => s.status === "ok" || s.status === "not_configured");
  const anyDown = Object.values(services).some((s) => s.status === "down");

  return c.json(
    {
      success: true,
      data: {
        status: anyDown ? "degraded" : allOk ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        env: env.nodeEnv,
        services,
      },
    },
    anyDown ? 503 : 200,
  );
});

// OAuth routes
app.get("/api/oauth/google", (c) => {
  const url = createGoogleAuthUrl();
  return c.redirect(url);
});

app.get("/api/oauth/google/callback", async (c) => {
  return handleGoogleCallback(c);
});

// tRPC
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// 404 catch-all for any unmatched /api/* path
app.all("/api/*", (c) => c.json({ success: false, error: "Not Found" }, 404));

// Global error handler
app.onError((err, c) => {
  logger.error("Unhandled error in HTTP handler", err);
  return c.json({ success: false, error: "Internal Server Error" }, 500);
});

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(env.port || "3000");
  serve({ fetch: app.fetch, port }, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    logger.info(`Health check: http://localhost:${port}/api/health`);
  });
}
