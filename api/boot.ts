import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { csrf } from "hono/csrf";
import { rateLimiter } from "hono-rate-limiter";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createGoogleAuthUrl, handleGoogleCallback } from "./lib/google-auth";
import { webhookRouter } from "./lib/webhook-router";
import { uploadRouter } from "./lib/upload-router";

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
  // CSRF protection for state‑changing requests
  // Hono's csrf middleware validates the "x-csrf-token" header. Tokens are generated per‑session
  // and can be retrieved client‑side via the "csrfToken" helper (not shown here).
});
app.use("*", csrf({
  // In production we only allow the registered frontend origin.
  origin: env.isProduction ? [env.frontendUrl] : ["http://localhost:5173", "http://localhost:3000"],
}));
app.use("*", cors({
  origin: env.isProduction ? [env.frontendUrl] : ["http://localhost:5173", "http://localhost:3000"],
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

// Health Check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

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
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
