import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leaderboardEntries } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const leaderboardRouter = createRouter({
  list: publicQuery
    .input(z.object({
      period: z.enum(["weekly", "monthly", "allTime"]).default("allTime"),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const period = input?.period ?? "allTime";
      return db.select().from(leaderboardEntries)
        .where(eq(leaderboardEntries.period, period))
        .orderBy(desc(leaderboardEntries.totalPoints))
        .limit(input?.limit ?? 50);
    }),

  getUserRank: authedQuery
    .input(z.object({
      period: z.enum(["weekly", "monthly", "allTime"]).default("allTime"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const period = input?.period ?? "allTime";
      const entry = await db.select().from(leaderboardEntries)
        .where(and(
          eq(leaderboardEntries.userId, ctx.user.id),
          eq(leaderboardEntries.period, period)
        ));
      return entry[0] ?? null;
    }),

  update: authedQuery
    .input(z.object({
      points: z.number(),
      exercisesCompleted: z.number().optional(),
      correctAnswers: z.number().optional(),
      studyHours: z.number().optional(),
      streak: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.select().from(leaderboardEntries)
        .where(and(
          eq(leaderboardEntries.userId, ctx.user.id),
          eq(leaderboardEntries.period, "allTime")
        ));

      if (existing[0]) {
        await db.update(leaderboardEntries)
          .set({
            totalPoints: (existing[0].totalPoints ?? 0) + input.points,
            exercisesCompleted: (existing[0].exercisesCompleted ?? 0) + (input.exercisesCompleted ?? 0),
            correctAnswers: (existing[0].correctAnswers ?? 0) + (input.correctAnswers ?? 0),
            studyHours: `${(parseFloat(existing[0].studyHours ?? "0") + (input.studyHours ?? 0)).toFixed(2)}`,
            currentStreak: input.streak ?? existing[0].currentStreak,
            bestStreak: Math.max(existing[0].bestStreak ?? 0, input.streak ?? 0),
            userName: ctx.user.name,
            userAvatar: ctx.user.avatar,
          })
          .where(eq(leaderboardEntries.id, existing[0].id));
      } else {
        await db.insert(leaderboardEntries).values({
          userId: ctx.user.id,
          userName: ctx.user.name,
          userAvatar: ctx.user.avatar,
          totalPoints: input.points,
          exercisesCompleted: input.exercisesCompleted ?? 0,
          correctAnswers: input.correctAnswers ?? 0,
          studyHours: `${(input.studyHours ?? 0).toFixed(2)}`,
          currentStreak: input.streak ?? 0,
          bestStreak: input.streak ?? 0,
          period: "allTime",
        });
      }

      return { success: true };
    }),
});
