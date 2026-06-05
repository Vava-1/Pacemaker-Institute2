import { z } from "zod";
import { createRouter, adminQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { 
  users, courses, enrollments, exerciseAttempts, messages, 
  payments, platformSettings, modules, lessons
} from "@db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalCourses = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const totalEnrollments = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
    
    // Revenue calc
    const revenueResult = await db.select({ total: sql<number>`SUM(amount)` })
      .from(payments).where(eq(payments.status, "completed"));
    
    const totalRevenueCents = revenueResult[0]?.total || 0;

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
      totalUsers: totalUsers[0]?.count ?? 0,
      totalCourses: totalCourses[0]?.count ?? 0,
      totalEnrollments: totalEnrollments[0]?.count ?? 0,
      totalRevenue: totalRevenueCents / 100, // Convert to dollars
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

  courses: authedQuery.query(async ({ ctx }) => {
    // Admins see all, instructors see their own
    const db = getDb();
    if (ctx.user?.role === "admin") {
      return db.select().from(courses).orderBy(desc(courses.createdAt));
    } else if (ctx.user?.role === "instructor") {
      return db.select().from(courses).where(eq(courses.instructorId, ctx.user.id)).orderBy(desc(courses.createdAt));
    }
    throw new TRPCError({ code: "FORBIDDEN" });
  }),

  createCourse: authedQuery
    .input(z.object({
      title: z.string().min(3),
      slug: z.string().min(3),
      categoryId: z.number(),
      price: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDb();
      const [result] = await db.insert(courses).values({
        title: input.title,
        slug: input.slug,
        categoryId: input.categoryId,
        instructorId: ctx.user.id,
        price: input.price || "0.00",
        status: "draft",
      });

      return { id: result.insertId };
    }),

  updateCourse: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      price: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      const course = courseRows[0];

      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      
      if (ctx.user?.role !== "admin" && course.instructorId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.update(courses).set(input).where(eq(courses.id, input.id));
      return { success: true };
    }),

  // PLATFORM SETTINGS
  getSettings: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(platformSettings);
  }),

  updateSettings: adminQuery
    .input(z.array(z.object({ key: z.string(), value: z.string() })))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const setting of input) {
        // Upsert logic
        const existing = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, setting.key)).limit(1);
        if (existing.length > 0) {
          await db.update(platformSettings).set({ settingValue: setting.value }).where(eq(platformSettings.settingKey, setting.key));
        } else {
          await db.insert(platformSettings).values({ settingKey: setting.key, settingValue: setting.value });
        }
      }
      return { success: true };
    }),
});
