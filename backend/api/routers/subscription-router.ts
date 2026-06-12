import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { subscriptionPlans, userSubscriptions, courses, enrollments } from "../../db/schema";
import { eq, desc, and, or, gte } from "drizzle-orm";

const TIER_ORDER: Record<string, number> = { free: 0, basic: 1, pro: 2, premium: 3 };

export const subscriptionRouter = createRouter({
  plans: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);
  }),

  mySubscription: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db.select({
      id: userSubscriptions.id,
      status: userSubscriptions.status,
      startedAt: userSubscriptions.startedAt,
      expiresAt: userSubscriptions.expiresAt,
      planName: subscriptionPlans.name,
      planSlug: subscriptionPlans.slug,
      planPrice: subscriptionPlans.price,
      planFeatures: subscriptionPlans.features,
    }).from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active")
      ))
      .orderBy(desc(userSubscriptions.startedAt))
      .limit(1);

    return result[0] ?? null;
  }),

  canAccessCourse: authedQuery
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const courseResult = await db.select({ planTier: courses.planTier })
        .from(courses).where(eq(courses.id, input.courseId)).limit(1);
      if (courseResult.length === 0) return { canAccess: false, reason: "Course not found" };

      const requiredTier = courseResult[0].planTier ?? "basic";
      if (requiredTier === "free") return { canAccess: true };

      const enrollmentResult = await db.select({ paymentStatus: enrollments.paymentStatus })
        .from(enrollments)
        .where(and(
          eq(enrollments.userId, ctx.user.id),
          eq(enrollments.courseId, input.courseId)
        ))
        .limit(1);

      if (enrollmentResult.length > 0 && enrollmentResult[0].paymentStatus === "paid") {
        return { canAccess: true };
      }

      const subResult = await db.select({ planSlug: subscriptionPlans.slug })
        .from(userSubscriptions)
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(userSubscriptions.userId, ctx.user.id),
          eq(userSubscriptions.status, "active"),
          or(
            gte(userSubscriptions.expiresAt, new Date()),
            eq(userSubscriptions.expiresAt, null as any),
          ),
        ))
        .limit(1);

      if (subResult.length > 0) {
        const userTier = subResult[0].planSlug;
        if ((TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 1)) {
          return { canAccess: true };
        }
      }

      return { canAccess: false, reason: "This course requires a subscription" };
    }),
});
