import { z } from "zod";
import { createRouter, adminQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import {
  users, courses, enrollments, payments, platformSettings, categories,
  modules, lessons, aiConversations, certificates, activityLogs,
  badges, reviews, testimonials, blogPosts,
  liveClasses, exerciseAttempts, exercises,
  exerciseConfig, exerciseReviewStatus, pointsAuditLog, leaderboardBans
} from "@db/schema";
import { desc, asc, sql, eq, and, gte, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hashPassword } from "../lib/auth";
import { logger } from "../lib/logger";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalCourses] = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const [totalEnrollments] = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
    const [totalCertificates] = await db.select({ count: sql<number>`count(*)` }).from(certificates);
    const [onlineUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isOnline, true));
    const [aiChats] = await db.select({ count: sql<number>`count(*)` }).from(aiConversations);
    const [reviewsCount] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const [testimonialsCount] = await db.select({ count: sql<number>`count(*)` }).from(testimonials);
    const [liveClassesCount] = await db.select({ count: sql<number>`count(*)` }).from(liveClasses);
    const [blogPostsCount] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    const [badgesCount] = await db.select({ count: sql<number>`count(*)` }).from(badges);
    
    const revenueResult = await db.select({ total: sql<string>`SUM(amount)` })
      .from(payments).where(eq(payments.status, "completed"));
    
    const totalRevenue = parseFloat(revenueResult[0]?.total || "0");

    // Enrollments over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const enrollmentsByDay = await db.select({
      day: sql<string>`DATE(enrolled_at)`,
      count: sql<number>`count(*)`,
    }).from(enrollments)
      .where(gte(enrollments.enrolledAt, sevenDaysAgo))
      .groupBy(sql`DATE(enrolled_at)`)
      .orderBy(sql`DATE(enrolled_at)`);

    // Revenue over time (last 7 days)
    const revenueByDay = await db.select({
      day: sql<string>`DATE(created_at)`,
      sum: sql<number>`SUM(amount)`,
    }).from(payments)
      .where(and(eq(payments.status, "completed"), gte(payments.createdAt, sevenDaysAgo)))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    // Category distribution
    const categoryDist = await db.select({
      name: categories.name,
      count: sql<number>`count(*)`,
      color: categories.color,
    }).from(courses)
      .rightJoin(categories, eq(courses.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.color);

    // Recent activity
    const recentActivity = await db.select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      action: activityLogs.action,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
      userName: users.name,
      userAvatar: users.avatar,
    }).from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);

    const [completedPayments] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "completed"));
    const [pendingPayments] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "pending"));
    const [failedPayments] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "failed"));
    const [refundedPayments] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "refunded"));
    const [totalAttempts] = await db.select({ count: sql<number>`count(*)` }).from(exerciseAttempts);

    const recentUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(10);

    const recentPayments = await db.select().from(payments)
      .where(eq(payments.status, "completed"))
      .orderBy(desc(payments.createdAt)).limit(10);

    return {
      totalUsers: totalUsers?.count ?? 0,
      totalCourses: totalCourses?.count ?? 0,
      totalEnrollments: totalEnrollments?.count ?? 0,
      totalRevenue,
      totalCertificates: totalCertificates?.count ?? 0,
      onlineUsers: onlineUsers?.count ?? 0,
      aiChats: aiChats?.count ?? 0,
      reviewsCount: reviewsCount?.count ?? 0,
      testimonialsCount: testimonialsCount?.count ?? 0,
      liveClassesCount: liveClassesCount?.count ?? 0,
      blogPostsCount: blogPostsCount?.count ?? 0,
      badgesCount: badgesCount?.count ?? 0,
      completedPayments: completedPayments?.count ?? 0,
      pendingPayments: pendingPayments?.count ?? 0,
      failedPayments: failedPayments?.count ?? 0,
      refundedPayments: refundedPayments?.count ?? 0,
      totalExerciseAttempts: totalAttempts?.count ?? 0,
      enrollmentsByDay,
      revenueByDay,
      categoryDistribution: categoryDist,
      recentActivity,
      recentUsers,
      recentPayments,
    };
  }),

  users: adminQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      role: users.role,
      totalPoints: users.totalPoints,
      studyStreak: users.studyStreak,
      isOnline: users.isOnline,
      isSuspended: users.isSuspended,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }),

  updateUserRole: adminQuery
    .input(z.object({ userId: z.number(), role: z.enum(["user", "instructor", "admin"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  toggleUserSuspension: adminQuery
    .input(z.object({ userId: z.number(), isSuspended: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ isSuspended: input.isSuspended }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  createUser: adminQuery
    .input(z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["user", "instructor", "admin"]).default("user"),
      emailVerified: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      }
      const passwordHash = await hashPassword(input.password);
      const [result] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        emailVerified: input.emailVerified,
      });
      const userId = Number(result.insertId);
      logger.info("Admin created user", { userId, email: input.email, role: input.role });
      return { success: true, userId, message: "User created successfully" };
    }),

  // ─── COURSES ────────────────────────────────────────────────

  courses: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    if (ctx.user?.role === "admin") {
      return db.select().from(courses).orderBy(desc(courses.createdAt));
    } else if (ctx.user?.role === "instructor") {
      return db.select().from(courses).where(eq(courses.instructorId, ctx.user.id)).orderBy(desc(courses.createdAt));
    }
    throw new TRPCError({ code: "FORBIDDEN" });
  }),

  getCourse: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      const course = courseRows[0];
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const moduleRows = await db.select()
        .from(modules).where(eq(modules.courseId, input.id))
        .orderBy(asc(modules.order));
      const lessonRows = await db.select()
        .from(lessons).where(eq(lessons.courseId, input.id))
        .orderBy(asc(lessons.order));
      return { ...course, modules: moduleRows.map((m: any) => ({
        ...m, lessons: lessonRows.filter((l: any) => l.moduleId === m.id)
      })) };
    }),

  getLesson: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const lessonRows = await db.select().from(lessons).where(eq(lessons.id, input.id)).limit(1);
      const lesson = lessonRows[0];
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return lesson;
    }),

  createCourse: authedQuery
    .input(z.object({
      title: z.string().min(3),
      slug: z.string().min(3),
      categoryId: z.number(),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
      language: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      thumbnail: z.string().optional(),
      previewVideo: z.string().optional(),
      isFeatured: z.boolean().optional(),
      requirements: z.array(z.string()).optional(),
      learningOutcomes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = getDb();
      // Check slug uniqueness
      const existingSlug = await db.select().from(courses).where(eq(courses.slug, input.slug)).limit(1);
      if (existingSlug.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A course with this slug already exists" });
      }
      const [result] = await db.insert(courses).values({
        title: input.title,
        slug: input.slug,
        categoryId: input.categoryId,
        instructorId: ctx.user.id,
        description: input.description ?? null,
        shortDescription: input.shortDescription ?? null,
        level: input.level ?? "beginner",
        language: input.language ?? "en",
        price: input.price ?? "0.00",
        originalPrice: input.originalPrice ?? null,
        thumbnail: input.thumbnail ?? null,
        previewVideo: input.previewVideo ?? null,
        isFeatured: input.isFeatured ?? false,
        requirements: input.requirements ?? null,
        learningOutcomes: input.learningOutcomes ?? null,
        tags: input.tags ?? null,
        status: "draft",
      });
      const id = Number(result.insertId);
      logger.info("Course created", { courseId: id, title: input.title });
      return { id };
    }),

  updateCourse: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      categoryId: z.number().optional(),
      level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
      language: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional().nullable(),
      thumbnail: z.string().optional().nullable(),
      previewVideo: z.string().optional().nullable(),
      isFeatured: z.boolean().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      requirements: z.array(z.string()).optional().nullable(),
      learningOutcomes: z.array(z.string()).optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      const course = courseRows[0];
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...updateData } = input;
      const cleaned = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(cleaned).length === 0) return { success: true };
      if (cleaned.slug) {
        const existingSlug = await db.select().from(courses).where(and(eq(courses.slug, cleaned.slug as string), ne(courses.id, id))).limit(1);
        if (existingSlug.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "A course with this slug already exists" });
        }
      }
      await db.update(courses).set(cleaned).where(eq(courses.id, id));
      logger.info("Course updated", { courseId: id });
      return { success: true };
    }),

  deleteCourse: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = getDb();
      await db.delete(lessons).where(eq(lessons.courseId, input.id));
      await db.delete(modules).where(eq(modules.courseId, input.id));
      await db.delete(courses).where(eq(courses.id, input.id));
      logger.info("Course deleted", { courseId: input.id });
      return { success: true };
    }),

  // ─── MODULES ────────────────────────────────────────────────

  createModule: authedQuery
    .input(z.object({
      courseId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      const course = courseRows[0];
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(display_order), -1)` })
        .from(modules).where(eq(modules.courseId, input.courseId));
      const [result] = await db.insert(modules).values({
        courseId: input.courseId,
        title: input.title,
        description: input.description ?? null,
        order: (maxOrder[0]?.max ?? -1) + 1,
      });
      return { id: Number(result.insertId) };
    }),

  updateModule: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const moduleRows = await db.select().from(modules).where(eq(modules.id, input.id)).limit(1);
      const mod = moduleRows[0];
      if (!mod) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, mod.courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...updateData } = input;
      const cleaned = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(cleaned).length === 0) return { success: true };
      await db.update(modules).set(cleaned).where(eq(modules.id, id));
      return { success: true };
    }),

  deleteModule: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const moduleRows = await db.select().from(modules).where(eq(modules.id, input.id)).limit(1);
      const mod = moduleRows[0];
      if (!mod) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, mod.courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.delete(lessons).where(eq(lessons.moduleId, input.id));
      await db.delete(modules).where(eq(modules.id, input.id));
      return { success: true };
    }),

  reorderModules: authedQuery
    .input(z.object({
      courseId: z.number(),
      moduleIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      const course = courseRows[0];
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      for (let i = 0; i < input.moduleIds.length; i++) {
        await db.update(modules).set({ order: i }).where(eq(modules.id, input.moduleIds[i]));
      }
      return { success: true };
    }),

  // ─── LESSONS ────────────────────────────────────────────────

  createLesson: authedQuery
    .input(z.object({
      moduleId: z.number(),
      courseId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["video", "text", "pdf", "quiz"]).default("video"),
      videoUrl: z.string().optional(),
      contentText: z.string().optional(),
      pdfUrl: z.string().optional(),
      duration: z.number().optional(),
      isFree: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      const course = courseRows[0];
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(display_order), -1)` })
        .from(lessons).where(and(eq(lessons.moduleId, input.moduleId), eq(lessons.courseId, input.courseId)));
      const [result] = await db.insert(lessons).values({
        moduleId: input.moduleId,
        courseId: input.courseId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        videoUrl: input.videoUrl ?? null,
        contentText: input.contentText ?? null,
        pdfUrl: input.pdfUrl ?? null,
        duration: input.duration ?? 0,
        isFree: input.isFree ?? false,
        order: (maxOrder[0]?.max ?? -1) + 1,
      });
      // Update totalLessons on course
      const count = await db.select({ count: sql<number>`count(*)` }).from(lessons).where(eq(lessons.courseId, input.courseId));
      await db.update(courses).set({ totalLessons: count[0]?.count ?? 0 }).where(eq(courses.id, input.courseId));
      return { id: Number(result.insertId) };
    }),

  updateLesson: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      type: z.enum(["video", "text", "pdf", "quiz"]).optional(),
      videoUrl: z.string().optional().nullable(),
      contentText: z.string().optional().nullable(),
      pdfUrl: z.string().optional().nullable(),
      duration: z.number().optional(),
      isFree: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const lessonRows = await db.select().from(lessons).where(eq(lessons.id, input.id)).limit(1);
      const lesson = lessonRows[0];
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...updateData } = input;
      const cleaned = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(cleaned).length === 0) return { success: true };
      await db.update(lessons).set(cleaned).where(eq(lessons.id, id));
      return { success: true };
    }),

  deleteLesson: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const lessonRows = await db.select().from(lessons).where(eq(lessons.id, input.id)).limit(1);
      const lesson = lessonRows[0];
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.delete(lessons).where(eq(lessons.id, input.id));
      const count = await db.select({ count: sql<number>`count(*)` }).from(lessons).where(eq(lessons.courseId, lesson.courseId));
      await db.update(courses).set({ totalLessons: count[0]?.count ?? 0 }).where(eq(courses.id, lesson.courseId));
      return { success: true };
    }),

  reorderLessons: authedQuery
    .input(z.object({
      moduleId: z.number(),
      lessonIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const firstLesson = await db.select().from(lessons).where(eq(lessons.id, input.lessonIds[0])).limit(1);
      if (!firstLesson.length) throw new TRPCError({ code: "NOT_FOUND" });
      const courseRows = await db.select().from(courses).where(eq(courses.id, firstLesson[0].courseId)).limit(1);
      const course = courseRows[0];
      if (ctx.user?.role !== "admin" && course?.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      for (let i = 0; i < input.lessonIds.length; i++) {
        await db.update(lessons).set({ order: i }).where(eq(lessons.id, input.lessonIds[i]));
      }
      return { success: true };
    }),

  // ─── SETTINGS ───────────────────────────────────────────────

  getSettings: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(platformSettings);
  }),

  updateSettings: adminQuery
    .input(z.array(z.object({ key: z.string(), value: z.string() })))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const setting of input) {
        const existing = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, setting.key)).limit(1);
        if (existing.length > 0) {
          await db.update(platformSettings).set({ settingValue: setting.value }).where(eq(platformSettings.settingKey, setting.key));
        } else {
          await db.insert(platformSettings).values({ settingKey: setting.key, settingValue: setting.value });
        }
      }
      return { success: true };
    }),

  // ─── CATEGORIES ─────────────────────────────────────────────

  getCategories: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).orderBy(categories.order);
  }),

  // ─── PAYMENTS ───────────────────────────────────────────────

  payments: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }),

  // ─── ADMIN SYSTEM PHASE 1 ──────────────────────────────────────

  getExerciseConfig: adminQuery.query(async () => {
    const db = getDb();
    const config = await db.select().from(exerciseConfig).limit(1);
    return config[0] ?? null;
  }),

  updateExerciseConfig: adminQuery
    .input(z.object({
      questionsPerCourse: z.number().optional(),
      easyPercent: z.number().optional(),
      mediumPercent: z.number().optional(),
      hardPercent: z.number().optional(),
      generationTime: z.string().optional(),
      aiModel: z.string().optional(),
      useFallbackBank: z.boolean().optional(),
      promptTemplate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(exerciseConfig).limit(1);
      if (existing.length > 0) {
        await db.update(exerciseConfig).set(input).where(eq(exerciseConfig.id, existing[0].id));
      } else {
        await db.insert(exerciseConfig).values({
          questionsPerCourse: input.questionsPerCourse ?? 3,
          easyPercent: input.easyPercent ?? 30,
          mediumPercent: input.mediumPercent ?? 50,
          hardPercent: input.hardPercent ?? 20,
          generationTime: input.generationTime ?? "00:01",
          aiModel: input.aiModel ?? "gemini-2.5-flash",
          useFallbackBank: input.useFallbackBank ?? true,
          promptTemplate: input.promptTemplate,
        });
      }
      return { success: true };
    }),

  getGeneratedExercises: adminQuery
    .input(z.object({
      courseId: z.number().optional(),
      status: z.enum(["pending", "approved", "rejected", "live"]).optional(),
      date: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      let conditions = [];
      if (input.courseId) conditions.push(eq(exercises.courseId, input.courseId));
      if (input.date) conditions.push(eq(exercises.dailyDate, input.date));
      if (input.status) conditions.push(eq(exerciseReviewStatus.status, input.status));
      
      const query = db.select({
        exercise: exercises,
        reviewStatus: exerciseReviewStatus,
        course: courses,
      })
      .from(exercises)
      .leftJoin(exerciseReviewStatus, eq(exercises.id, exerciseReviewStatus.exerciseId))
      .leftJoin(courses, eq(exercises.courseId, courses.id));

      if (conditions.length > 0) {
        return query.where(and(...conditions)).orderBy(desc(exercises.createdAt));
      }
      return query.orderBy(desc(exercises.createdAt));
    }),

  updateExerciseReviewStatus: adminQuery
    .input(z.object({
      exerciseId: z.number(),
      status: z.enum(["pending", "approved", "rejected", "live"]),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.select().from(exerciseReviewStatus).where(eq(exerciseReviewStatus.exerciseId, input.exerciseId)).limit(1);
      if (existing.length > 0) {
        await db.update(exerciseReviewStatus).set({
          status: input.status,
          rejectionReason: input.rejectionReason,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        }).where(eq(exerciseReviewStatus.exerciseId, input.exerciseId));
      } else {
        await db.insert(exerciseReviewStatus).values({
          exerciseId: input.exerciseId,
          status: input.status,
          rejectionReason: input.rejectionReason,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        });
      }
      return { success: true };
    }),

  editExercise: adminQuery
    .input(z.object({
      id: z.number(),
      question: z.string().optional(),
      options: z.any().optional(),
      correctAnswer: z.string().optional(),
      points: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      const cleaned = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(cleaned).length > 0) {
        await db.update(exercises).set(cleaned).where(eq(exercises.id, id));
      }
      return { success: true };
    }),

  getLeaderboardBans: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(leaderboardBans).orderBy(desc(leaderboardBans.bannedAt));
  }),

  adjustUserPoints: adminQuery
    .input(z.object({
      userId: z.number(),
      pointsChanged: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userRows = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!userRows.length) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      
      const newTotal = userRows[0].totalPoints + input.pointsChanged;
      await db.update(users).set({ totalPoints: newTotal }).where(eq(users.id, input.userId));
      
      await db.insert(pointsAuditLog).values({
        userId: input.userId,
        pointsChanged: input.pointsChanged,
        newTotal,
        reason: input.reason,
        adjustedBy: ctx.user.id,
      });
      return { success: true };
    }),

  banUserFromLeaderboard: adminQuery
    .input(z.object({
      userId: z.number(),
      reason: z.string(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(leaderboardBans).values({
        userId: input.userId,
        reason: input.reason,
        bannedBy: ctx.user.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
      });
      return { success: true };
    }),

  getPointsAuditLog: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(pointsAuditLog).orderBy(desc(pointsAuditLog.createdAt));
  }),

  getAIUsageStats: adminQuery.query(async () => {
    const db = getDb();
    const [totalConversations] = await db.select({ count: sql<number>`count(*)` }).from(aiConversations);
    const [totalAIFeedbackAttempts] = await db.select({ count: sql<number>`count(*)` })
      .from(exerciseAttempts).where(sql`ai_feedback IS NOT NULL`);
    
    const recentConversations = await db.select({
      id: aiConversations.id,
      userName: users.name,
      discipline: sql<string>`'General'`,
      messageCount: sql<number>`1`,
      createdAt: aiConversations.createdAt
    }).from(aiConversations)
      .leftJoin(users, eq(aiConversations.userId, users.id))
      .orderBy(desc(aiConversations.createdAt))
      .limit(10);

    return {
      totalConversations: totalConversations?.count ?? 0,
      avgMessages: 5,
      totalFeedback: totalAIFeedbackAttempts?.count ?? 0,
      recentConversations
    };
  }),
});
