import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { logger } from "./lib/logger";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// ── Error logging ──────────────────────────────────────────────────

export const errorLogging = middleware(async (opts) => {
  try {
    return await opts.next();
  } catch (err) {
    const e = err as TRPCError;
    if (e.code === "INTERNAL_SERVER_ERROR") {
      logger.error("tRPC error", {
        path: opts.path,
        type: opts.type,
        code: e.code,
        message: e.message,
      });
    }
    throw err;
  }
});

// ── Auth guards ────────────────────────────────────────────────────

export const protectedProcedure = publicProcedure.use(errorLogging).use(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (ctx.user.isSuspended) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const instructorProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.user.role !== "instructor" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied. Instructor or admin role required." });
  }
  return next(opts);
});

export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied. Admin role required." });
  }
  return next(opts);
});

// ── Rate limiting ──────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitedProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  const key = `trpc:${ctx.user!.id}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return next(opts);
  }

  if (entry.count >= 60) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please slow down.",
    });
  }

  entry.count++;
  return next(opts);
});

// ── Legacy aliases ─────────────────────────────────────────────────

export const publicQuery = publicProcedure;
export const authedQuery = protectedProcedure;
export const adminQuery = adminProcedure;
