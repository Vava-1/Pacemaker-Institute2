import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, modules, lessons, enrollments, categories, users } from "../../db/schema";
import { eq, and, like, desc, sql, inArray } from "drizzle-orm";

export const courseRouter = createRouter({
  publicStats: publicQuery.query(async () => {
    const db = getDb();

    const studentResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "user"));
    const instructorResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "instructor"));
    const courseResult = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.status, "published"));
    const completedResult = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.isCompleted, true));
    const ratingResult = await db.select({ avg: sql<string>`avg(rating)` }).from(courses).where(and(eq(courses.status, "published"), sql`rating > 0`));

    return {
      totalStudents: Number(studentResult[0]?.count ?? 0),
      totalInstructors: Number(instructorResult[0]?.count ?? 0),
      totalCourses: Number(courseResult[0]?.count ?? 0),
      completedCourses: Number(completedResult[0]?.count ?? 0),
      averageRating: ratingResult[0]?.avg ? parseFloat(ratingResult[0].avg).toFixed(1) : "0.0",
    };
  }),
  list: publicQuery
    .input(z.object({
      categorySlug: z.string().optional(),
      level: z.string().optional(),
      search: z.string().optional(),
      featured: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      let query = db.select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        shortDescription: courses.shortDescription,
        thumbnail: courses.thumbnail,
        price: courses.price,
        originalPrice: courses.originalPrice,
        rating: courses.rating,
        totalStudents: courses.totalStudents,
        totalLessons: courses.totalLessons,
        level: courses.level,
        language: courses.language,
        duration: courses.duration,
        isFeatured: courses.isFeatured,
        categoryId: courses.categoryId,
        instructorId: courses.instructorId,
        createdAt: courses.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      }).from(courses).leftJoin(categories, eq(courses.categoryId, categories.id));

      const conditions = [];
      if (input?.categorySlug) {
        const catRows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
        const catId = catRows[0]?.id;
        if (catId) {
          const childIds = (await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, catId))).map((c: any) => c.id);
          if (childIds.length > 0) {
            conditions.push(inArray(courses.categoryId, [...childIds, catId]));
          } else {
            conditions.push(eq(courses.categoryId, catId));
          }
        }
      }
      if (input?.level) {
        conditions.push(eq(courses.level, input.level as any));
      }
      if (input?.search) {
        conditions.push(like(courses.title, `%${input.search}%`));
      }
      if (input?.featured) {
        conditions.push(eq(courses.isFeatured, true));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return query.orderBy(desc(courses.createdAt));
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const courseResult = await db.select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        shortDescription: courses.shortDescription,
        thumbnail: courses.thumbnail,
        previewVideo: courses.previewVideo,
        price: courses.price,
        originalPrice: courses.originalPrice,
        rating: courses.rating,
        totalStudents: courses.totalStudents,
        totalLessons: courses.totalLessons,
        level: courses.level,
        language: courses.language,
        duration: courses.duration,
        requirements: courses.requirements,
        learningOutcomes: courses.learningOutcomes,
        tags: courses.tags,
        createdAt: courses.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      }).from(courses)
        .leftJoin(categories, eq(courses.categoryId, categories.id))
        .where(eq(courses.slug, input.slug));

      if (!courseResult[0]) return null;

      const modulesResult = await db.select().from(modules)
        .where(eq(modules.courseId, courseResult[0].id))
        .orderBy(modules.order);

      const lessonsResult = await db.select().from(lessons)
        .where(eq(lessons.courseId, courseResult[0].id))
        .orderBy(lessons.order);

      return {
        ...courseResult[0],
        modules: modulesResult,
        lessons: lessonsResult,
      };
    }),

  enroll: authedQuery
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.select().from(enrollments)
        .where(and(
          eq(enrollments.userId, ctx.user.id),
          eq(enrollments.courseId, input.courseId)
        ));

      if (existing.length > 0) {
        return { success: true, alreadyEnrolled: true, paymentStatus: existing[0].paymentStatus };
      }

      const course = (await db.select({ price: courses.price }).from(courses).where(eq(courses.id, input.courseId)).limit(1))[0];
      const isFree = course && Number(course.price) === 0;

      await db.insert(enrollments).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        progress: 0,
        paymentStatus: isFree ? "paid" : "pending",
        amount: course?.price ?? "0.00",
      });

      await db.update(courses)
        .set({ totalStudents: sql`${courses.totalStudents} + 1` })
        .where(eq(courses.id, input.courseId));

      return { success: true, alreadyEnrolled: false, paymentStatus: isFree ? "paid" : "pending" };
    }),

  myCourses: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      thumbnail: courses.thumbnail,
      price: courses.price,
      progress: enrollments.progress,
      isCompleted: enrollments.isCompleted,
      enrolledAt: enrollments.enrolledAt,
      paymentStatus: enrollments.paymentStatus,
      categoryName: categories.name,
    }).from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(enrollments.userId, ctx.user.id));
  }),

  updateProgress: authedQuery
    .input(z.object({
      courseId: z.number(),
      progress: z.number().min(0).max(100),
      lessonId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(enrollments)
        .set({
          progress: input.progress,
          lastLessonId: input.lessonId ?? null,
          isCompleted: input.progress >= 100,
          completedAt: input.progress >= 100 ? new Date() : undefined,
        })
        .where(and(
          eq(enrollments.userId, ctx.user.id),
          eq(enrollments.courseId, input.courseId)
        ));
      return { success: true };
    }),
});
