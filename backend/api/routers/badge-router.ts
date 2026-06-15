import { createRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { badges, userBadges } from "@db/schema";
import { eq } from "drizzle-orm";

export const badgeRouter = createRouter({
  list: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(badges);
  }),

  myBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    return db.select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      color: badges.color,
      points: badges.points,
      earnedAt: userBadges.earnedAt,
    }).from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, ctx.user.id));
  }),
});
