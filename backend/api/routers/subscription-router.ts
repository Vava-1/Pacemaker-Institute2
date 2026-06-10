import { createRouter, publicQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { subscriptionPlans, userSubscriptions } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";

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
});
