import { z } from "zod";
import { createRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { reviews, users } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const reviewRouter = createRouter({
  list: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
      }).from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.courseId, input.courseId))
        .orderBy(desc(reviews.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({ courseId: z.number(), rating: z.number().min(1).max(5), comment: z.string().max(1000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.select().from(reviews)
        .where(and(eq(reviews.userId, ctx.user.id), eq(reviews.courseId, input.courseId)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(reviews).set({ rating: input.rating, comment: input.comment ?? null }).where(eq(reviews.id, existing[0].id));
        return { success: true, updated: true };
      }
      await db.insert(reviews).values({ userId: ctx.user.id, courseId: input.courseId, rating: input.rating, comment: input.comment ?? null });
      return { success: true, updated: false };
    }),

  /** Allow a user to delete their own review. Project 16 spec. */
  delete: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(reviews).where(eq(reviews.id, input.reviewId)).limit(1);
      const review = rows[0];
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }
      if (review.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own reviews" });
      }
      await db.delete(reviews).where(eq(reviews.id, input.reviewId));
      return { success: true };
    }),
});
