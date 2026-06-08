import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { authRouter } from "./auth-router";
import { categoryRouter } from "./routers/category-router";
import { courseRouter } from "./routers/course-router";
import { exerciseRouter } from "./routers/exercise-router";
import { leaderboardRouter } from "./routers/leaderboard-router";
import { messageRouter } from "./routers/message-router";
import { notificationRouter } from "./routers/notification-router";
import { aiRouter } from "./routers/ai-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { testimonialRouter } from "./routers/testimonial-router";
import { subscriptionRouter } from "./routers/subscription-router";
import { adminRouter } from "./routers/admin-router";
import { paymentRouter } from "./routers/payment-router";
import { lessonRouter } from "./routers/lesson-router";
import { certificateRouter } from "./routers/certificate-router";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    const zodError = error.cause instanceof z.ZodError ? error.cause.flatten() : null;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError,
      },
    };
  },
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;

const errorLogging = t.middleware(async (opts) => {
  try {
    return await opts.next();
  } catch (err) {
    const e = err as TRPCError;
    if (e.code === "INTERNAL_SERVER_ERROR") {
      const logger = (await import("./lib/logger")).logger;
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

export const appRouter = createRouter({
  ping: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  category: categoryRouter,
  course: courseRouter,
  lesson: lessonRouter,
  certificate: certificateRouter,
  exercise: exerciseRouter,
  leaderboard: leaderboardRouter,
  message: messageRouter,
  notification: notificationRouter,
  ai: aiRouter,
  dashboard: dashboardRouter,
  testimonial: testimonialRouter,
  subscription: subscriptionRouter,
  admin: adminRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
