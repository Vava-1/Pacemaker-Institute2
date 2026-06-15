import { z } from "zod";
import { createRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { liveClasses, liveClassBookings, users } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const liveClassRouter = createRouter({
  list: publicProcedure
    .input(z.object({ status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.status ? eq(liveClasses.status, input.status) : undefined;
      const rows = await db.select({
        id: liveClasses.id,
        title: liveClasses.title,
        description: liveClasses.description,
        scheduledAt: liveClasses.scheduledAt,
        duration: liveClasses.duration,
        maxStudents: liveClasses.maxStudents,
        meetingUrl: liveClasses.meetingUrl,
        thumbnail: liveClasses.thumbnail,
        status: liveClasses.status,
        instructorName: users.name,
      })
        .from(liveClasses)
        .leftJoin(users, eq(liveClasses.instructorId, users.id))
        .where(where)
        .orderBy(desc(liveClasses.scheduledAt));

      return rows.map((r: any) => ({
        ...r,
        studentCount: 0,
      }));
    }),

  book: protectedProcedure
    .input(z.object({ liveClassId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const classRows = await db.select().from(liveClasses).where(eq(liveClasses.id, input.liveClassId)).limit(1);
      if (!classRows.length) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await db.select().from(liveClassBookings)
        .where(and(eq(liveClassBookings.userId, ctx.user.id), eq(liveClassBookings.liveClassId, input.liveClassId)))
        .limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Already booked" });

      await db.insert(liveClassBookings).values({ userId: ctx.user.id, liveClassId: input.liveClassId });
      return { success: true };
    }),
});
