import { createRouter, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, enrollments, exercises, exerciseAttempts, leaderboardEntries, certificates, notifications } from "../../db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
    const myCerts = await db.select().from(certificates).where(eq(certificates.userId, userId));
    const myNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId));

    const totalPoints = attempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
    const exercisesCompleted = attempts.length;
    const correctAnswers = attempts.filter((a: any) => a.isCorrect).length;
    const accuracy = exercisesCompleted > 0 ? Math.round((correctAnswers / exercisesCompleted) * 100) : 0;

    const rankEntry = await db.select().from(leaderboardEntries)
      .where(and(eq(leaderboardEntries.userId, userId), eq(leaderboardEntries.period, "allTime")));

    return {
      enrolledCourses: myEnrollments.length,
      completedCourses: myEnrollments.filter((e: any) => e.isCompleted).length,
      totalStudyMinutes: myEnrollments.reduce((sum: number, e: any) => sum + (e.totalTimeSpent ?? 0), 0),
      exercisesCompleted,
      accuracy,
      totalPoints,
      certificates: myCerts.length,
      unreadNotifications: myNotifications.filter((n: any) => !n.isRead).length,
      currentStreak: ctx.user.studyStreak ?? 0,
      rank: rankEntry[0]?.rank ?? null,
      globalRank: rankEntry[0] ? await getGlobalRank(db, totalPoints) : null,
    };
  }),

  activity: authedQuery.query(async ({ ctx }) => {
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

  courseExercises: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myCourseIds = await db.select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id));
    if (myCourseIds.length === 0) return [];
    const ids = myCourseIds.map((e) => e.courseId);
    const exs = await db.select().from(exercises)
      .where(and(inArray(exercises.courseId, ids), eq(exercises.aiGenerated, false)))
      .orderBy(desc(exercises.createdAt))
      .limit(10);
    const attemptedIds = (await db.select({ exerciseId: exerciseAttempts.exerciseId })
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, ctx.user.id)))
      .map((a) => a.exerciseId);
    const attemptedSet = new Set(attemptedIds);
    return exs.map((ex) => ({
      ...ex,
      done: attemptedSet.has(ex.id),
    }));
  }),

  recommendations: authedQuery.query(async () => {
    const db = getDb();
    let query = db.select({
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

    return query;
  }),
});

async function getGlobalRank(db: any, points: number) {
  const result = await db.select({ rank: sql<number>`COUNT(*) + 1` })
    .from(leaderboardEntries)
    .where(and(
      eq(leaderboardEntries.period, "allTime"),
      sql`total_points > ${points}`
    ));
  return result[0]?.rank ?? 1;
}
