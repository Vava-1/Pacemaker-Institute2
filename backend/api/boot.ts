import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { appRouter } from "./router";
import { createContext } from "./context";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
  }
}

import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { autoInitialize } from "../db/auto-init";
import { createGoogleAuthUrl, handleGoogleCallback } from "./lib/google-auth";
import { webhookRouter } from "./lib/webhook-router";
import { uploadRouter } from "./lib/upload-router";
import { getDb } from "./queries/connection";
import { emailQueue } from "@db/schema";
import { sendEmailWithRetry } from "./lib/mailer";

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
    // 'unsafe-inline' kept for now because Vite injects inline scripts in dev;
    // tighten to nonces in a follow-up.
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://api.stripe.com"],
    frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    mediaSrc: ["'self'", "https:", "blob:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
    // Restrict powerful APIs
    // (hono/secure-headers doesn't have a direct Permissions-Policy option;
    // the header is set below via a custom middleware)
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

// Mount webhook router AND tRPC BEFORE bodyLimit so raw body is preserved
app.route("/api/webhooks", webhookRouter);

// tRPC — must be before bodyLimit to avoid consuming the request body stream
async function trpcHandler(c: any) {
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

// Body Limit to prevent large payloads
app.use("/api/upload", bodyLimit({ maxSize: 100 * 1024 * 1024 }));
app.use("/api/*", bodyLimit({ maxSize: 1024 * 1024 }));

// Mount upload router
app.route("/api/upload", uploadRouter);

// ===== Health Checks =====
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/detailed", async (c) => {
  const services: Record<string, { status: "ok" | "down" | "not_configured"; detail?: string; latencyMs?: number }> = {};

  const dbStart = Date.now();
  try {
    const db = getDb();
    await db.execute("SELECT 1" as any);
    services.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (e: any) {
    services.database = { status: "down", detail: e?.message ?? String(e) };
  }

  const hasRealStripeKey = env.stripeSecretKey && !env.stripeSecretKey.startsWith("sk_test_...") && env.stripeSecretKey.length > 20;
  if (hasRealStripeKey) {
    const stripeStart = Date.now();
    try {
      // Drop the bogus apiVersion override; let Stripe use the account default.
      const stripe = new Stripe(env.stripeSecretKey);
      await stripe.balance.retrieve();
      services.stripe = { status: "ok", latencyMs: Date.now() - stripeStart };
    } catch (e: any) {
      services.stripe = { status: "down", detail: e?.message ?? String(e) };
    }
  } else {
    services.stripe = { status: "not_configured" };
  }

  if (env.smtpHost && env.smtpUser) {
    services.smtp = { status: "ok", detail: "Configured" };
  } else {
    services.smtp = { status: "not_configured" };
  }

  const anyDown = Object.values(services).some((s) => s.status === "down");
  const status = anyDown ? "degraded" : "ok";

  return c.json(
    { status, timestamp: new Date().toISOString(), env: env.nodeEnv, version: "1.0.1", uptime: process.uptime(), services },
    anyDown ? 503 : 200,
  );
});

app.get("/api/ready", async (c) => {
  try {
    const db = getDb();
    await db.execute("SELECT 1" as any);
    return c.json({ status: "ready", timestamp: new Date().toISOString() }, 200);
  } catch (e: any) {
    const cause = (e as any)?.cause ?? e;
    logger.error("Database readiness check failed", {
      error: e?.message ?? String(e),
      cause: cause?.message,
      code: cause?.code,
      sqlMessage: cause?.sqlMessage,
    });
    return c.json({ status: "not ready", detail: e?.message ?? String(e), timestamp: new Date().toISOString() }, 503);
  }
});

app.get("/api/live", (c) => {
  return c.json({ alive: true, timestamp: new Date().toISOString() });
});

// OAuth routes
app.get("/api/oauth/google", (c) => {
  const url = createGoogleAuthUrl(c);
  return c.redirect(url);
});

app.get("/api/oauth/google/callback", async (c) => {
  return handleGoogleCallback(c);
});

// 404 catch-all
app.all("/api/*", (c) => {
  logger.warn("API 404", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not Found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";
  logger.error("Unhandled error in HTTP handler", {
    requestId, path: c.req.path, method: c.req.method, error: err.message, stack: env.isProduction ? undefined : err.stack,
  });
  return c.json(
    { success: false, error: "Internal Server Error", message: env.isProduction ? "An unexpected error occurred" : err.message, requestId },
    500,
  );
});

// Global error handlers — per Node.js docs, after an uncaughtException the
// process state is undefined and it MUST exit. We log and let Railway restart.
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  logger.error("Uncaught Exception — exiting", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error("UNHANDLED REJECTION:", err);
  logger.error("Unhandled Rejection — exiting", { error: err.message, stack: err.stack });
  process.exit(1);
});

// Graceful shutdown handlers — drain DB pool before exit.
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  try {
    const { closeDatabase } = await import("./queries/connection");
    await closeDatabase();
    logger.info("Database pool closed.");
  } catch (e: any) {
    logger.error("Error closing database pool", { error: e?.message });
  }
  setTimeout(() => {
    logger.info("Forced shutdown after timeout");
    process.exit(0);
  }, 10000).unref();
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  try {
    const { closeDatabase } = await import("./queries/connection");
    await closeDatabase();
    logger.info("Database pool closed.");
  } catch (e: any) {
    logger.error("Error closing database pool", { error: e?.message });
  }
  setTimeout(() => {
    logger.info("Forced shutdown after timeout");
    process.exit(0);
  }, 5000).unref();
});

// Initialize Sentry before serving traffic (production only).
try {
  if (env.isProduction && process.env.SENTRY_DSN) {
    await logger.init.sentry();
    logger.info("Sentry initialized.");
  } else {
    logger.info("Sentry not initialized (not production or no SENTRY_DSN).");
  }
} catch (e: any) {
  logger.error("Failed to initialize Sentry", { error: e?.message });
}

const { serve } = await import("@hono/node-server");
const { serveStaticFiles } = await import("./lib/vite");

logger.info("Starting server process...");
logger.info(`Environment: ${env.nodeEnv}`);
logger.info(`Database URL configured: ${Boolean(env.databaseUrl)}`);

// --- FIX 1: STRICT INITIALIZATION SEQUENCE ---
// Await migrations *before* serving traffic to ensure tables exist.
try {
  logger.info("Running database initialization and migrations...");
  await autoInitialize();
  logger.info("Database initialization successful.");
} catch (err: any) {
  logger.error("Fatal error during database initialization", { error: err.message });
  // Ensure the container crashes loudly so Railway restarts it, rather than hanging.
  process.exit(1); 
}

serveStaticFiles(app);

const port = parseInt(env.port || "3000");
serve({ fetch: app.fetch, port }, () => {
  logger.info(`Server running on http://0.0.0.0:${port}/`);
  logger.info(`Health check: http://0.0.0.0:${port}/api/health`);
  logger.info(`Ready check: http://0.0.0.0:${port}/api/ready`);
  logger.info(`Live check: http://0.0.0.0:${port}/api/live`);
});

// --- FIX 2: SYNTAX ERROR RESOLUTION ---
// The setInterval block was missing its closing brace and interval time.
setInterval(async () => {
  try {
    const db = getDb();
    const pending = await db.select().from(emailQueue).where(eq(emailQueue.status, "pending")).limit(10);

    for (const email of pending) {
      const result = await sendEmailWithRetry(email.to, email.subject, email.body);
      await db.update(emailQueue).set({
        status: result.success ? "sent" : "failed",
        attempts: email.attempts + 1,
        sentAt: result.success ? new Date() : null,
      }).where(eq(emailQueue.id, email.id));
    }
  } catch (err: any) {
    const cause = err?.cause ?? err;
    logger.error("Email queue processing error", {
      error: err.message,
      cause: cause?.message,
      code: cause?.code ?? err.code,
      sqlMessage: cause?.sqlMessage ?? err.sqlMessage,
      sqlState: cause?.sqlState ?? err.sqlState,
      errno: cause?.errno ?? err.errno,
    });
  }
}, 60 * 1000); // Set to run every 60 seconds
