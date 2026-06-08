import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { verifyAccessToken } from "./lib/auth";
import { logger } from "./lib/logger";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;

// Auth middleware - extract and verify token
const authMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  if (ctx.user.isSuspended) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account has been suspended",
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Role-based middleware factory
function requireRole(...allowedRoles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
    }
    
    if (!allowedRoles.includes(ctx.user.role)) {
      logger.warn("Insufficient role access attempt", {
        userRole: ctx.user.role,
        requiredRoles: allowedRoles,
        path: opts.path,
        userId: ctx.user.id,
      });
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }
    
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// Input validation middleware factory
function validateBody<T>(schema: z.ZodSchema<T>) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const body = await ctx.req?.json?.();
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Validation failed",
        cause: result.error.flatten(),
      });
    }
    return next({ ctx: { ...ctx, validatedBody: result.data } });
  });
}

// Request ID middleware
const requestIdMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const requestId = ctx.requestId || crypto.randomUUID();
  return next({ ctx: { ...ctx, requestId } });
});

export const protectedProcedure = t.procedure.use(authMiddleware);
export const instructorProcedure = protectedProcedure.use(requireRole("instructor", "admin"));
export const adminProcedure = protectedProcedure.use(requireRole("admin"));

// Rate-limited procedure (60 req/min per user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const rateLimitedMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) return next(opts);
  
  const key = `trpc:${ctx.user.id}`;
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

export const rateLimitedProcedure = protectedProcedure.use(rateLimitedMiddleware);
