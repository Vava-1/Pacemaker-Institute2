import { createRouter, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, enrollments, exercises, exerciseAttempts, leaderboardEntries, certificates, notifications, users } from "../../db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
    const myCerts = await db.select().from(certificates).where(eq(certificates.userId, userId));
    const myNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId));
    const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

    const exercisesCompleted = attempts.length;
    const totalPoints = attempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
    const correctAnswers = attempts.filter((a: any) => a.isCorrect || (a.aiCorrectnessPercent ?? 0) >= 70).length;
    const accuracy = exercisesCompleted > 0 ? Math.round((correctAnswers / exercisesCompleted) * 100) : 0;

    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const weeklyAttempts = attempts.filter((a: any) => new Date(a.attemptedAt) >= weekStart);
    const monthlyAttempts = attempts.filter((a: any) => new Date(a.attemptedAt) >= monthStart);

    const rankEntry = await db.select().from(leaderboardEntries)
      .where(and(eq(leaderboardEntries.userId, userId), eq(leaderboardEntries.period, "allTime")));

    return {
      enrolledCourses: myEnrollments.length,
      completedCourses: myEnrollments.filter((e: any) => e.isCompleted).length,
      totalStudyMinutes: myEnrollments.reduce((sum: number, e: any) => sum + (e.totalTimeSpent ?? 0), 0),
      exercisesCompleted,
      accuracy,
      totalPoints,
      weeklyPoints: user?.weeklyPoints ?? weeklyAttempts.reduce((s: number, a: any) => s + (a.pointsEarned ?? 0), 0),
      monthlyPoints: user?.monthlyPoints ?? monthlyAttempts.reduce((s: number, a: any) => s + (a.pointsEarned ?? 0), 0),
      certificates: myCerts.length,
      unreadNotifications: myNotifications.filter((n: any) => !n.isRead).length,
      currentStreak: user?.studyStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      rankTier: user?.rankTier ?? "Bronze",
      rank: rankEntry[0]?.rank ?? null,
      globalRank: rankEntry[0] ?? null,
    };
  }),

  activity: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const recentEnrollments = await db.select({
      title: courses.title,
      slug: courses.slug,
      thumbnail: courses.thumbnail,
      progress: enrollments.progress,
      enrolledAt: enrollments.enrolledAt,
    }).from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, ctx.user.id))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(5);

    return { recentEnrollments };
  }),

  courseExercises: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const myCourseIds = await db.select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id));
    if (myCourseIds.length === 0) return [];
    const ids = myCourseIds.map((e: any) => e.courseId);
    const exs = await db.select().from(exercises)
      .where(and(inArray(exercises.courseId, ids), eq(exercises.aiGenerated, false)))
      .orderBy(desc(exercises.createdAt))
      .limit(10);
    const attemptedIds = (await db.select({ exerciseId: exerciseAttempts.exerciseId })
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, ctx.user.id)))
      .map((a: any) => a.exerciseId);
    const attemptedSet = new Set(attemptedIds);
    return exs.map((ex: any) => ({
      ...ex,
      done: attemptedSet.has(ex.id),
    }));
  }),

  recommendations: protectedProcedure.query(async () => {
    const db = getDb();
    return db.select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      thumbnail: courses.thumbnail,
      shortDescription: courses.shortDescription,
      level: courses.level,
      rating: courses.rating,
      price: courses.price,
      categoryId: courses.categoryId,
    }).from(courses).where(eq(courses.status, "published")).orderBy(desc(courses.rating)).limit(6);
  }),
});
