import { createRouter, publicProcedure, protectedProcedure, instructorProcedure, adminProcedure } from "./trpc";
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
import { blogRouter } from "./routers/blog-router";

export { createRouter, publicProcedure, protectedProcedure, instructorProcedure, adminProcedure };

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
  blog: blogRouter,
});

export type AppRouter = typeof appRouter;
