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

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
  }
}
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { createGoogleAuthUrl, handleGoogleCallback } from "./lib/google-auth";
import { webhookRouter } from "./lib/webhook-router";
import { uploadRouter } from "./lib/upload-router";
import { getDb } from "./queries/connection";

if (!env.geminiApiKey && !env.grokApiKey && !env.deepseekApiKey) {
  logger.warn("No AI provider keys configured. AI tutor will be disabled.");
}

const app = new Hono<{ Bindings: HttpBindings }>();

// Security Headers with CSP
app.use("*", secureHeaders({
  xFrameOptions: "DENY",
  xXssProtection: "1; mode=block",
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  crossOriginOpenerPolicy: "same-origin",
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "https:", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://api.stripe.com"],
    frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    mediaSrc: ["'self'", "https:", "blob:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
}));

// CORS
app.use("*", cors({
  origin: env.isProduction ? [env.frontendUrl] : ["http://localhost:5173", "http://localhost:3000", env.frontendUrl],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposeHeaders: ["X-Total-Count", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400,
}));

// Handle OPTIONS preflight
app.options("*", (c) => c.body(null, 204));

// General Rate Limiting (100 requests per minute)
app.use("/api/*", rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const userId = (c as any).get?.("userId");
    return userId?.toString() || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown-ip";
  },
  handler: (c) => {
    logger.warn("Rate limit exceeded", { path: c.req.path, ip: c.req.header("x-forwarded-for") });
    return c.json({ success: false, error: "Too many requests. Please try again later." }, 429);
  },
}));

// Auth-specific stricter rate limiting
app.use("/api/auth/*", rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown-ip";
  },
  handler: (c) => {
    logger.warn("Auth rate limit exceeded", { path: c.req.path, ip: c.req.header("x-forwarded-for") });
    return c.json({ success: false, error: "Too many authentication attempts. Please try again later." }, 429);
  },
}));

// Request ID and logging middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  c.res.headers.set("X-Request-ID", requestId);

  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";

  logger.info(`${method} ${path}`, { requestId, ip, userAgent });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  if (status >= 500) {
    logger.error(`${method} ${path} ${status} (${duration}ms)`, { requestId, status, duration });
  } else if (status >= 400) {
    logger.warn(`${method} ${path} ${status} (${duration}ms)`, { requestId, status, duration });
  } else {
    logger.info(`${method} ${path} ${status} (${duration}ms)`, { requestId, status, duration });
  }
});

// Mount webhook router BEFORE bodyLimit so we get raw body text for Stripe
app.route("/api/webhooks", webhookRouter);

// Body Limit to prevent large payloads
// Proxy uploads (images, PDFs, small videos) — 100MB
// Large videos use direct-to-Cloudinary upload (bypasses this limit)
app.use("/api/upload", bodyLimit({ maxSize: 100 * 1024 * 1024 }));
app.use("/api/*", bodyLimit({ maxSize: 1024 * 1024 }));

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

  // 2. Stripe (only if configured with a real-looking key)
  const hasRealStripeKey = env.stripeSecretKey && !env.stripeSecretKey.startsWith("sk_test_...") && env.stripeSecretKey.length > 20;
  if (hasRealStripeKey) {
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

  // 3. SMTP
  if (env.smtpHost && env.smtpUser) {
    services.smtp = { status: "ok", detail: "Configured" };
  } else {
    services.smtp = { status: "not_configured" };
  }

  const anyDown = Object.values(services).some((s) => s.status === "down");
  const status = anyDown ? "degraded" : "ok";

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      env: env.nodeEnv,
      version: "1.0.1",
      uptime: process.uptime(),
      services,
    },
    anyDown ? 503 : 200,
  );
});

// Readiness check
app.get("/api/ready", async (c) => {
  try {
    const db = getDb();
    await db.execute("SELECT 1" as any);
    return c.json({ status: "ready", timestamp: new Date().toISOString() }, 200);
  } catch {
    return c.json({ status: "not ready", timestamp: new Date().toISOString() }, 503);
  }
});

// Liveness check
app.get("/api/live", (c) => {
  return c.json({ alive: true, timestamp: new Date().toISOString() });
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
async function trpcHandler(c: any) {
  console.log("tRPC handler called", c.req.path, c.req.method);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, req: c.req.raw }),
  });
}

app.get("/api/trpc", (c) => c.json({ message: "trpc GET" }));
app.post("/api/trpc", trpcHandler);
app.all("/api/trpc/*", trpcHandler);

// 404 catch-all for any unmatched /api/* path
app.all("/api/*", (c) => {
  logger.warn("API 404", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not Found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";
  logger.error("Unhandled error in HTTP handler", {
    requestId,
    path: c.req.path,
    method: c.req.method,
    error: err.message,
    stack: env.isProduction ? undefined : err.stack,
  });
  return c.json(
    {
      success: false,
      error: "Internal Server Error",
      message: env.isProduction ? "An unexpected error occurred" : err.message,
      requestId,
    },
    500,
  );
});

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  setTimeout(() => {
    logger.info("Forced shutdown after timeout");
    process.exit(0);
  }, 10000).unref();
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  setTimeout(() => {
    logger.info("Forced shutdown after timeout");
    process.exit(0);
  }, 5000).unref();
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
    logger.info(`Ready check: http://localhost:${port}/api/ready`);
    logger.info(`Live check: http://localhost:${port}/api/live`);
  });
}
