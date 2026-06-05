import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { courses, enrollments, exerciseAttempts, leaderboardEntries, certificates, notifications } from "../../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
    const myCerts = await db.select().from(certificates).where(eq(certificates.userId, userId));
    const myNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId));

    const totalPoints = attempts.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
    const exercisesCompleted = attempts.length;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const accuracy = exercisesCompleted > 0 ? Math.round((correctAnswers / exercisesCompleted) * 100) : 0;

    const rankEntry = await db.select().from(leaderboardEntries)
      .where(and(eq(leaderboardEntries.userId, userId), eq(leaderboardEntries.period, "allTime")));

    return {
      enrolledCourses: myEnrollments.length,
      completedCourses: myEnrollments.filter(e => e.isCompleted).length,
      totalStudyMinutes: myEnrollments.reduce((sum, e) => sum + (e.totalTimeSpent ?? 0), 0),
      exercisesCompleted,
      accuracy,
      totalPoints,
      certificates: myCerts.length,
      unreadNotifications: myNotifications.filter(n => !n.isRead).length,
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
    }).from(courses).where(sql`${courses.isPublished} = true`).orderBy(desc(courses.rating)).limit(6);

    return query;
  }),
});

async function getGlobalRank(db: any, points: number) {
  const allEntries = await db.select({ totalPoints: leaderboardEntries.totalPoints })
    .from(leaderboardEntries)
    .where(eq(leaderboardEntries.period, "allTime"))
    .orderBy(desc(leaderboardEntries.totalPoints));

  const rank = allEntries.findIndex((e: any) => (e.totalPoints ?? 0) <= points) + 1;
  return rank > 0 ? rank : allEntries.length + 1;
}
