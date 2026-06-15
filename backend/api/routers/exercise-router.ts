import { z } from "zod";
import { createRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { exercises, exerciseAttempts, enrollments, courses, categories, users, leaderboardEntries } from "../../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { generatePersonalizedExercises, sendMessage, type GeneratedExercise } from "../lib/ai-service";
import { logger } from "../lib/logger";

const TODAY = () => new Date().toISOString().split("T")[0];
const YESTERDAY = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};
const WEEK_START = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const MONTH_START = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" {
  if (points >= 10000) return "Diamond";
  if (points >= 5000) return "Platinum";
  if (points >= 2000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

async function gradeWithAi(question: string, correctAnswer: string | null | undefined, userAnswer: string, maxPoints: number, questionType: string) {
  if (questionType === "multiple_choice" || questionType === "true_false" || questionType === "fill_blank" || questionType === "matching") {
    if (!correctAnswer) {
      return {
        score: 0,
        feedback: "No reference answer available for grading.",
        correctnessPercent: 0,
        strengths: [],
        improvements: ["Unable to grade automatically"],
      };
    }
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    return {
      score: isCorrect ? maxPoints : 0,
      feedback: isCorrect ? "Correct!" : `The correct answer was: ${correctAnswer}`,
      correctnessPercent: isCorrect ? 100 : 0,
      strengths: isCorrect ? ["Correct answer"] : [],
      improvements: isCorrect ? [] : ["Review the correct answer and try again"],
    };
  }

  try {
    const prompt = `You are an educational grader. Evaluate this student answer:

Question: ${question}
Correct Answer Reference: ${correctAnswer ?? "N/A (open-ended)"}
Student Answer: ${userAnswer}
Max Points: ${maxPoints}

Grade strictly but fairly. Return ONLY valid JSON with these exact fields:
{
  "score": number between 0 and ${maxPoints},
  "correctness_percent": number between 0 and 100,
  "feedback": "detailed constructive feedback in 1-2 sentences",
  "strengths": ["what they did well"],
  "improvements": ["what to improve"]
}`;

    const result = await sendMessage({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek",
    });

    let cleaned = result.content.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
    const parsed = JSON.parse(cleaned);

    return {
      score: Math.min(Math.max(Math.round(parsed.score), 0), maxPoints),
      feedback: parsed.feedback || "Graded by AI.",
      correctnessPercent: Math.min(Math.max(parsed.correctness_percent, 0), 100),
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
    };
  } catch (e) {
    logger.error("AI grading failed", { error: String(e) });
    return {
      score: Math.round(maxPoints / 2),
      feedback: "Your answer has been recorded. Manual review may be needed.",
      correctnessPercent: 50,
      strengths: [],
      improvements: [],
    };
  }
}

async function updateUserStats(db: any, userId: number) {
  const allAttempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
  const total = allAttempts.length;
  const totalPoints = allAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const totalPossible = allAttempts.reduce((sum: number, a: any) => sum + (a.aiCorrectnessPercent ?? (a.isCorrect ? 100 : 0)), 0);
  const accuracy = total > 0 ? Math.round(totalPossible / total) : 0;

  const weekStart = WEEK_START();
  const monthStart = MONTH_START();
  const weeklyAttempts = allAttempts.filter((a: any) => new Date(a.attemptedAt) >= weekStart);
  const monthlyAttempts = allAttempts.filter((a: any) => new Date(a.attemptedAt) >= monthStart);
  const weeklyPoints = weeklyAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const monthlyPoints = monthlyAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const tier = calculateTier(totalPoints);

  const lastSubDates = allAttempts
    .map((a: any) => new Date(a.attemptedAt).toISOString().split("T")[0])
    .filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i)
    .sort()
    .reverse();

  let streak = 0;
  const today = TODAY();
  if (lastSubDates[0] === today || lastSubDates[0] === YESTERDAY()) {
    streak = 1;
    for (let i = 1; i < lastSubDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - streak);
      if (lastSubDates[i] === expected.toISOString().split("T")[0]) {
        streak++;
      } else break;
    }
  }

  const existing = await db.select().from(users).where(eq(users.id, userId));
  const longestStreak = Math.max(streak, existing[0]?.longestStreak ?? 0);

  await db.update(users)
    .set({
      totalPoints,
      weeklyPoints,
      monthlyPoints,
      accuracyPercent: accuracy,
      rankTier: tier,
      studyStreak: streak,
      longestStreak,
      lastSubmissionDate: lastSubDates[0] ?? null,
    })
    .where(eq(users.id, userId));

  return { totalPoints, weeklyPoints, monthlyPoints, accuracy, streak, tier, totalAttempts: total };
}

async function syncLeaderboard(db: any, userId: number, userName: string | null, userAvatar: string | null) {
  const weekStart = WEEK_START();
  const monthStart = MONTH_START();

  const allAttempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
  const totalPoints = allAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const weeklyAttempts = allAttempts.filter((a: any) => new Date(a.attemptedAt) >= weekStart);
  const monthlyAttempts = allAttempts.filter((a: any) => new Date(a.attemptedAt) >= monthStart);
  const weeklyPoints = weeklyAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const monthlyPoints = monthlyAttempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);
  const correctCount = allAttempts.filter((a: any) => a.isCorrect || (a.aiCorrectnessPercent ?? 0) >= 70).length;
  const accuracy = allAttempts.length > 0 ? Math.round((correctCount / allAttempts.length) * 100) : 0;
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

  const periods = [
    { period: "weekly" as const, points: weeklyPoints },
    { period: "monthly" as const, points: monthlyPoints },
    { period: "allTime" as const, points: totalPoints },
  ];

  for (const { period, points } of periods) {
    const existing = await db.select().from(leaderboardEntries)
      .where(and(eq(leaderboardEntries.userId, userId), eq(leaderboardEntries.period, period)));

    const data = {
      totalPoints: points,
      exercisesCompleted: allAttempts.length,
      correctAnswers: correctCount,
      currentStreak: user?.studyStreak ?? 0,
      bestStreak: user?.longestStreak ?? 0,
      userName: userName ?? "Anonymous",
      userAvatar: userAvatar,
      accuracy: accuracy,
    };

    if (existing[0]) {
      await db.update(leaderboardEntries).set(data).where(eq(leaderboardEntries.id, existing[0].id));
    } else {
      await db.insert(leaderboardEntries).values({ userId, period, ...data });
    }
  }

  for (const period of ["weekly", "monthly", "allTime"] as const) {
    const allEntries = await db.select().from(leaderboardEntries)
      .where(eq(leaderboardEntries.period, period))
      .orderBy(desc(leaderboardEntries.totalPoints));

    for (let i = 0; i < allEntries.length; i++) {
      await db.update(leaderboardEntries)
        .set({ rank: i + 1 })
        .where(eq(leaderboardEntries.id, allEntries[i].id));
    }
  }
}

export const exerciseRouter = createRouter({
  list: publicProcedure
    .input(z.object({
      courseId: z.number().optional(),
      categoryId: z.number().optional(),
      difficulty: z.string().optional(),
      language: z.string().optional(),
      isDaily: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      let query = db.select().from(exercises);
      const conditions = [];
      if (input?.courseId) conditions.push(eq(exercises.courseId, input.courseId));
      if (input?.difficulty) conditions.push(eq(exercises.difficulty, input.difficulty as any));
      if (input?.language) conditions.push(eq(exercises.language, input.language));
      if (input?.isDaily) conditions.push(eq(exercises.isDaily, true));
      conditions.push(eq(exercises.aiGenerated, false));
      if (conditions.length > 0) query = query.where(and(...conditions)) as any;
      return query.orderBy(desc(exercises.createdAt));
    }),

  getDaily: publicProcedure.query(async () => {
    const db = getDb();
    const today = TODAY();
    return db.select().from(exercises)
      .where(and(eq(exercises.isDaily, true), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, false)));
  }),

  getPersonalizedDaily: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const today = TODAY();
    const existing = await db.select().from(exercises)
      .where(and(eq(exercises.userId, ctx.user.id), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));

    if (existing.length > 0) {
      const attemptedIds = (await db.select({ exerciseId: exerciseAttempts.exerciseId })
        .from(exerciseAttempts)
        .where(eq(exerciseAttempts.userId, ctx.user.id)))
        .map((a) => a.exerciseId);
      const attemptedSet = new Set(attemptedIds);
      return existing.map((ex) => ({
        ...ex,
        done: attemptedSet.has(ex.id),
        userScore: null as number | null,
      }));
    }

    const userEnrollments = await db.select({
      courseId: enrollments.courseId,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      categoryName: categories.name,
      progress: enrollments.progress,
      level: courses.level,
    }).from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(enrollments.userId, ctx.user.id));

    if (userEnrollments.length === 0) return [];

    const attempts = await db.select().from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, ctx.user.id));
    const total = attempts.length;
    const correct = attempts.filter((a: any) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    let generated: GeneratedExercise[] = [];
    try {
      generated = await generatePersonalizedExercises({
        userName: ctx.user.name ?? "Student",
        courses: userEnrollments.map((e) => ({
          title: e.courseTitle,
          slug: e.courseSlug,
          categoryName: e.categoryName,
        })),
        accuracy,
        totalExercisesDone: total,
        count: Math.min(userEnrollments.length * 2, 6),
      });
    } catch (e) {
      logger.error("AI exercise generation failed for user", { userId: ctx.user.id, error: String(e) });
    }

    if (generated.length === 0) return [];

    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const values = generated.map((ex) => ({
      title: ex.title,
      question: ex.question,
      type: ex.type as any,
      options: ex.options as any,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation,
      difficulty: ex.difficulty as any,
      points: ex.points,
      isDaily: true,
      dailyDate: today,
      userId: ctx.user.id,
      aiGenerated: true,
      topicTags: [userEnrollments[0]?.categoryName ?? "general"],
      expiresAt,
    }));

    await db.insert(exercises).values(values);

    logger.info("AI personalized exercises generated", {
      userId: ctx.user.id,
      count: generated.length,
      courses: userEnrollments.length,
    });

    const fresh = await db.select().from(exercises)
      .where(and(eq(exercises.userId, ctx.user.id), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));
    return fresh.map((ex) => ({ ...ex, done: false, userScore: null }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(exercises).where(eq(exercises.id, input.id));
      return result[0] ?? null;
    }),

  submit: protectedProcedure
    .input(z.object({
      exerciseId: z.number(),
      answer: z.string().min(1, "Answer is required"),
      timeSpent: z.number().min(0).max(3600).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const ex = await db.select().from(exercises).where(eq(exercises.id, input.exerciseId));
      if (!ex[0]) throw new Error("Exercise not found");

      const existingAttempt = await db.select().from(exerciseAttempts)
        .where(and(
          eq(exerciseAttempts.userId, ctx.user.id),
          eq(exerciseAttempts.exerciseId, input.exerciseId),
        ));
      if (existingAttempt[0]) {
        return {
          success: true,
          alreadyAttempted: true,
          isCorrect: existingAttempt[0].isCorrect,
          pointsEarned: existingAttempt[0].pointsEarned,
          aiEvaluation: existingAttempt[0].aiEvaluation,
          correctAnswer: ex[0].correctAnswer,
          explanation: ex[0].explanation,
        };
      }

      const exercise = ex[0];
      const maxPoints = exercise.points ?? 10;

      const evaluation = await gradeWithAi(
        exercise.question,
        exercise.correctAnswer,
        input.answer,
        maxPoints,
        exercise.type,
      );

      const isCorrect = evaluation.score >= Math.round(maxPoints * 0.7);
      const pointsEarned = evaluation.score;

      await db.insert(exerciseAttempts).values({
        userId: ctx.user.id,
        exerciseId: input.exerciseId,
        answer: input.answer,
        isCorrect,
        pointsEarned,
        timeSpent: input.timeSpent ?? 30,
        aiScore: evaluation.score,
        aiFeedback: evaluation.feedback,
        aiCorrectnessPercent: evaluation.correctnessPercent,
        aiEvaluation: evaluation as any,
      });

      const userStats = await updateUserStats(db, ctx.user.id);
      await syncLeaderboard(db, ctx.user.id, ctx.user.name, ctx.user.avatar);

      logger.info("Exercise submitted and graded", {
        userId: ctx.user.id,
        exerciseId: input.exerciseId,
        pointsEarned,
        isCorrect,
        accuracy: evaluation.correctnessPercent,
      });

      return {
        success: true,
        alreadyAttempted: false,
        isCorrect,
        pointsEarned,
        aiEvaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          correctnessPercent: evaluation.correctnessPercent,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
        userStats,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
      };
    }),

  myAttempts: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    return db.select({
      id: exerciseAttempts.id,
      exerciseId: exerciseAttempts.exerciseId,
      isCorrect: exerciseAttempts.isCorrect,
      pointsEarned: exerciseAttempts.pointsEarned,
      timeSpent: exerciseAttempts.timeSpent,
      attemptedAt: exerciseAttempts.attemptedAt,
      aiScore: exerciseAttempts.aiScore,
      aiFeedback: exerciseAttempts.aiFeedback,
      aiCorrectnessPercent: exerciseAttempts.aiCorrectnessPercent,
      exerciseTitle: exercises.title,
      exerciseQuestion: exercises.question,
    }).from(exerciseAttempts)
      .innerJoin(exercises, eq(exerciseAttempts.exerciseId, exercises.id))
      .where(eq(exerciseAttempts.userId, ctx.user.id))
      .orderBy(desc(exerciseAttempts.attemptedAt));
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const u = user[0];
    return {
      total: u?.totalPoints ?? 0,
      correct: 0,
      incorrect: 0,
      accuracy: u?.accuracyPercent ?? 0,
      totalPoints: u?.totalPoints ?? 0,
      weeklyPoints: u?.weeklyPoints ?? 0,
      monthlyPoints: u?.monthlyPoints ?? 0,
      streak: u?.studyStreak ?? 0,
      longestStreak: u?.longestStreak ?? 0,
      rankTier: u?.rankTier ?? "Bronze",
    };
  }),

  history: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - (input?.days ?? 30));
      return db.select({
        id: exerciseAttempts.id,
        exerciseId: exerciseAttempts.exerciseId,
        isCorrect: exerciseAttempts.isCorrect,
        pointsEarned: exerciseAttempts.pointsEarned,
        attemptedAt: exerciseAttempts.attemptedAt,
        exerciseTitle: exercises.title,
        exerciseQuestion: exercises.question,
        aiFeedback: exerciseAttempts.aiFeedback,
        aiCorrectnessPercent: exerciseAttempts.aiCorrectnessPercent,
      }).from(exerciseAttempts)
        .innerJoin(exercises, eq(exerciseAttempts.exerciseId, exercises.id))
        .where(and(
          eq(exerciseAttempts.userId, ctx.user.id),
          gte(exerciseAttempts.attemptedAt, since),
        ))
        .orderBy(desc(exerciseAttempts.attemptedAt));
    }),

  generateDailyExercises: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const today = TODAY();
      const targetUserId = input?.userId ?? ctx.user.id;

      const existing = await db.select().from(exercises)
        .where(and(eq(exercises.userId, targetUserId), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));
      if (existing.length > 0) return { generated: 0, message: "Exercises already generated for today" };

      const userEnrollments = await db.select({
        courseId: enrollments.courseId,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        categoryName: categories.name,
        progress: enrollments.progress,
        level: courses.level,
      }).from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(categories, eq(courses.categoryId, categories.id))
        .where(eq(enrollments.userId, targetUserId));

      if (userEnrollments.length === 0) return { generated: 0, message: "No enrolled courses" };

      const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, targetUserId));
      const total = attempts.length;
      const correct = attempts.filter((a: any) => a.isCorrect).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const user = (await db.select().from(users).where(eq(users.id, targetUserId)))[0];

      let generated: GeneratedExercise[] = [];
      try {
        generated = await generatePersonalizedExercises({
          userName: user?.name ?? "Student",
          courses: userEnrollments.map((e) => ({
            title: e.courseTitle,
            slug: e.courseSlug,
            categoryName: e.categoryName,
          })),
          accuracy,
          totalExercisesDone: total,
          count: Math.min(userEnrollments.length * 2, 6),
        });
      } catch (e) {
        logger.error("AI generation failed for user", { userId: targetUserId, error: String(e) });
      }

      if (generated.length === 0) return { generated: 0, message: "AI generation returned no exercises" };

      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      const values = generated.map((ex) => ({
        title: ex.title,
        question: ex.question,
        type: ex.type as any,
        options: ex.options as any,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation,
        difficulty: ex.difficulty as any,
        points: ex.points,
        isDaily: true,
        dailyDate: today,
        userId: targetUserId,
        aiGenerated: true,
        topicTags: [userEnrollments[0]?.categoryName ?? "general"],
        expiresAt,
      }));

      await db.insert(exercises).values(values);

      return { generated: generated.length, message: "Exercises generated successfully" };
    }),

  generateAllDaily: protectedProcedure.mutation(async () => {
    const db = getDb();
    const today = TODAY();

    const activeUsers = await db.select({
      userId: enrollments.userId,
    }).from(enrollments).groupBy(enrollments.userId);

    let totalGenerated = 0;
    for (const { userId } of activeUsers) {
      const existing = await db.select().from(exercises)
        .where(and(eq(exercises.userId, userId), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));
      if (existing.length > 0) continue;

      const userEnrollments = await db.select({
        courseTitle: courses.title,
        courseSlug: courses.slug,
        categoryName: categories.name,
      }).from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(categories, eq(courses.categoryId, categories.id))
        .where(eq(enrollments.userId, userId));

      if (userEnrollments.length === 0) continue;

      const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
      const total = attempts.length;
      const correct = attempts.filter((a: any) => a.isCorrect).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

      let generated: GeneratedExercise[] = [];
      try {
        generated = await generatePersonalizedExercises({
          userName: user?.name ?? "Student",
          courses: userEnrollments.map((e) => ({
            title: e.courseTitle,
            slug: e.courseSlug,
            categoryName: e.categoryName,
          })),
          accuracy,
          totalExercisesDone: total,
          count: Math.min(userEnrollments.length * 2, 6),
        });
      } catch (e) {
        logger.error("AI generation failed in bulk cron", { userId, error: String(e) });
      }

      if (generated.length === 0) continue;

      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);

      const values = generated.map((ex) => ({
        title: ex.title,
        question: ex.question,
        type: ex.type as any,
        options: ex.options as any,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation,
        difficulty: ex.difficulty as any,
        points: ex.points,
        isDaily: true,
        dailyDate: today,
        userId,
        aiGenerated: true,
        topicTags: [userEnrollments[0]?.categoryName ?? "general"],
        expiresAt,
      }));

      await db.insert(exercises).values(values);
      totalGenerated += generated.length;
    }

    logger.info("Bulk daily exercise generation complete", { totalGenerated, usersCount: activeUsers.length });
    return { generated: totalGenerated, usersProcessed: activeUsers.length };
  }),

  recalculateStats: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const stats = await updateUserStats(db, ctx.user.id);
    await syncLeaderboard(db, ctx.user.id, ctx.user.name, ctx.user.avatar);
    return stats;
  }),
});
