import { z } from "zod";
import { createRouter, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { notifications } from "../../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const notificationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }),

  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),

  unreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return result[0]?.count ?? 0;
  }),
});
