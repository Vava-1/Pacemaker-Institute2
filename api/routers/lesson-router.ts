import { z } from "zod";
import { createRouter, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { lessons, enrollments, lessonProgress } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const lessonRouter = createRouter({
  getLessonContent: authedQuery
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      
      const lessonResult = await db.select().from(lessons).where(eq(lessons.id, input.lessonId)).limit(1);
      const lesson = lessonResult[0];

      if (!lesson) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      // Check enrollment and payment
      const enrollmentCheck = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, lesson.courseId)))
        .limit(1);

      if (enrollmentCheck.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You must be enrolled to view this lesson" });
      }

      const enrollment = enrollmentCheck[0];

      if (enrollment.paymentStatus !== "paid") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Payment is required to access this lesson" });
      }

      // Update last accessed lesson
      await db.update(enrollments)
        .set({ lastLessonId: lesson.id })
        .where(eq(enrollments.id, enrollment.id));

      return lesson;
    }),

  markCompleted: authedQuery
    .input(z.object({ lessonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const lessonResult = await db.select().from(lessons).where(eq(lessons.id, input.lessonId)).limit(1);
      const lesson = lessonResult[0];

      if (!lesson) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const enrollmentCheck = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, lesson.courseId)))
        .limit(1);

      if (enrollmentCheck.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You must be enrolled to track progress" });
      }

      const enrollment = enrollmentCheck[0];

      // Upsert progress
      const existingProgress = await db.select().from(lessonProgress)
        .where(and(eq(lessonProgress.enrollmentId, enrollment.id), eq(lessonProgress.lessonId, lesson.id)))
        .limit(1);

      if (existingProgress.length === 0) {
        await db.insert(lessonProgress).values({
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          isCompleted: true,
          watchedSeconds: lesson.duration || 0,
        });
      } else {
        await db.update(lessonProgress)
          .set({ isCompleted: true, watchedSeconds: lesson.duration || 0, lastAccessedAt: new Date() })
          .where(eq(lessonProgress.id, existingProgress[0].id));
      }

      // Recalculate course progress percentage
      const courseLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, lesson.courseId));
      const completedLessons = await db.select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.enrollmentId, enrollment.id), eq(lessonProgress.isCompleted, true)));

      const totalLessons = courseLessons.length;
      const completedCount = completedLessons.length;
      
      let newProgress = 0;
      if (totalLessons > 0) {
        newProgress = Math.round((completedCount / totalLessons) * 100);
      }

      await db.update(enrollments)
        .set({ 
          progress: newProgress,
          isCompleted: newProgress >= 100,
          completedAt: newProgress >= 100 && !enrollment.isCompleted ? new Date() : enrollment.completedAt,
        })
        .where(eq(enrollments.id, enrollment.id));

      return { success: true, newProgress };
    }),
});
