import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logger } from "./lib/logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(roles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || !roles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

const errorLogging = t.middleware(async (opts) => {
  try {
    return await opts.next();
  } catch (err) {
    const e = err as TRPCError;
    logger.error("tRPC error", {
      path: opts.path,
      type: opts.type,
      code: e?.code,
      message: e?.message,
      cause: (e as any)?.cause?.message,
    });
    throw err;
  }
});

export const authedQuery = t.procedure.use(errorLogging).use(requireAuth);
export const instructorQuery = authedQuery.use(requireRole(["instructor", "admin"]));
export const adminQuery = authedQuery.use(requireRole(["admin"]));
