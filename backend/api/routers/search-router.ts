import { z } from "zod";
import { createRouter, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, blogPosts, users, categories } from "../../db/schema";
import { eq, or, like, desc, and, sql } from "drizzle-orm";

export const searchRouter = createRouter({
  global: publicQuery
    .input(z.object({ q: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      const db = getDb();
      const term = `%${input.q}%`;

      const [courseResults, blogResults, instructorResults, categoryResults] = await Promise.all([
        db.select({
          id: courses.id,
          title: courses.title,
          slug: courses.slug,
          shortDescription: courses.shortDescription,
          thumbnail: courses.thumbnail,
          price: courses.price,
          level: courses.level,
          totalStudents: courses.totalStudents,
          rating: courses.rating,
          createdAt: courses.createdAt,
          _type: sql<string>`'course'`.as("_type"),
        }).from(courses)
          .where(and(
            eq(courses.status, "published"),
            or(
              like(courses.title, term),
              like(courses.shortDescription, term),
              sql`JSON_SEARCH(${courses.tags}, 'one', ${input.q}) IS NOT NULL`,
            ),
          ))
          .orderBy(desc(courses.totalStudents))
          .limit(5),

        db.select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          image: blogPosts.image,
          authorName: blogPosts.authorName,
          createdAt: blogPosts.createdAt,
          _type: sql<string>`'blog'`.as("_type"),
        }).from(blogPosts)
          .where(and(
            eq(blogPosts.published, true),
            or(
              like(blogPosts.title, term),
              like(blogPosts.excerpt, term),
              sql`JSON_SEARCH(${blogPosts.tags}, 'one', ${input.q}) IS NOT NULL`,
            ),
          ))
          .orderBy(desc(blogPosts.createdAt))
          .limit(5),

        db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: users.role,
          _type: sql<string>`'instructor'`.as("_type"),
        }).from(users)
          .where(and(
            eq(users.role, "instructor"),
            or(
              like(users.name, term),
              like(users.email, term),
            ),
          ))
          .orderBy(desc(users.totalPoints))
          .limit(5),

        db.select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          icon: categories.icon,
          color: categories.color,
          _type: sql<string>`'category'`.as("_type"),
        }).from(categories)
          .where(or(
            like(categories.name, term),
            like(categories.description, term),
          ))
          .limit(5),
      ]);

      return {
        query: input.q,
        courses: courseResults,
        blogs: blogResults,
        instructors: instructorResults,
        categories: categoryResults,
        total: courseResults.length + blogResults.length + instructorResults.length + categoryResults.length,
      };
    }),
});
