import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { exercises, exerciseAttempts, enrollments, courses, categories } from "../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { generatePersonalizedExercises } from "../lib/ai-service";
import { logger } from "../lib/logger";

export const exerciseRouter = createRouter({
  list: publicQuery
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

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      return query.orderBy(desc(exercises.createdAt));
    }),

  getDaily: publicQuery.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    return db.select().from(exercises)
      .where(and(eq(exercises.isDaily, true), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, false)));
  }),

  getPersonalizedDaily: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    const existing = await db.select().from(exercises)
      .where(and(eq(exercises.userId, ctx.user.id), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));

    if (existing.length > 0) return existing;

    const userEnrollments = await db.select({
      courseId: enrollments.courseId,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      categoryName: categories.name,
    }).from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(enrollments.userId, ctx.user.id));

    const attempts = await db.select().from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, ctx.user.id));

    const total = attempts.length;
    const correct = attempts.filter((a: any) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const generated = await generatePersonalizedExercises({
      userName: ctx.user.name ?? "Student",
      courses: userEnrollments.map((e) => ({
        title: e.courseTitle,
        slug: e.courseSlug,
        categoryName: e.categoryName,
      })),
      accuracy,
      totalExercisesDone: total,
    });

    if (generated.length === 0) return [];

    const values = generated.map((ex) => ({
      title: ex.title,
      question: ex.question,
      type: ex.type as "multiple_choice" | "fill_blank" | "matching" | "true_false",
      options: ex.options as any,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation,
      difficulty: ex.difficulty as "easy" | "medium" | "hard",
      points: ex.points,
      isDaily: true,
      dailyDate: today,
      userId: ctx.user.id,
      aiGenerated: true,
    }));

    const inserted = await db.insert(exercises).values(values);

    logger.info("AI personalized exercises generated", {
      userId: ctx.user.id,
      count: generated.length,
      accuracy,
      courses: userEnrollments.length,
    });

    return db.select().from(exercises)
      .where(and(eq(exercises.userId, ctx.user.id), eq(exercises.dailyDate, today), eq(exercises.aiGenerated, true)));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(exercises).where(eq(exercises.id, input.id));
      return result[0] ?? null;
    }),

  submit: authedQuery
    .input(z.object({
      exerciseId: z.number(),
      answer: z.string(),
      timeSpent: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const ex = await db.select().from(exercises).where(eq(exercises.id, input.exerciseId));
      if (!ex[0]) throw new Error("Exercise not found");

      const exercise = ex[0];
      let isCorrect = false;

      if (exercise.type === "multiple_choice" || exercise.type === "true_false") {
        const options = (exercise.options as { text: string; isCorrect: boolean }[]) || [];
        isCorrect = options.some((o) => o.isCorrect && o.text.trim().toLowerCase() === input.answer.trim().toLowerCase());
      } else if (exercise.type === "fill_blank") {
        isCorrect = input.answer.trim().toLowerCase() === (exercise.correctAnswer ?? "").trim().toLowerCase();
      }

      const pointsEarned = isCorrect ? (exercise.points ?? 10) : 0;

      await db.insert(exerciseAttempts).values({
        userId: ctx.user.id,
        exerciseId: input.exerciseId,
        answer: input.answer,
        isCorrect,
        pointsEarned,
        timeSpent: input.timeSpent ?? 0,
      });

      return {
        success: true,
        isCorrect,
        pointsEarned,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
      };
    }),

  myAttempts: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select({
      id: exerciseAttempts.id,
      exerciseId: exerciseAttempts.exerciseId,
      isCorrect: exerciseAttempts.isCorrect,
      pointsEarned: exerciseAttempts.pointsEarned,
      timeSpent: exerciseAttempts.timeSpent,
      attemptedAt: exerciseAttempts.attemptedAt,
      exerciseTitle: exercises.title,
    }).from(exerciseAttempts)
      .innerJoin(exercises, eq(exerciseAttempts.exerciseId, exercises.id))
      .where(eq(exerciseAttempts.userId, ctx.user.id))
      .orderBy(desc(exerciseAttempts.attemptedAt));
  }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const attempts = await db.select().from(exerciseAttempts)
      .where(eq(exerciseAttempts.userId, ctx.user.id));

    const total = attempts.length;
    const correct = attempts.filter((a: any) => a.isCorrect).length;
    const totalPoints = attempts.reduce((sum: number, a: any) => sum + (a.pointsEarned ?? 0), 0);

    return { total, correct, incorrect: total - correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, totalPoints };
  }),
});
