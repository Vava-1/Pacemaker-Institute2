import { createRouter, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { blogPosts } from "../../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const blogRouter = createRouter({
  list: publicQuery
    .input(z.object({ tag: z.string().optional(), language: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(blogPosts.published, true)];
      if (input?.language) {
        conditions.push(eq(blogPosts.language, input.language));
      }
      const posts = await db
        .select()
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.createdAt));
      if (input?.tag) {
        return posts.filter((p: any) => p.tags?.includes(input.tag));
      }
      return posts;
    }),

  featured: publicQuery
    .input(z.object({ language: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(blogPosts.featured, true)];
      if (input?.language) {
        conditions.push(eq(blogPosts.language, input.language));
      }
      return db
        .select()
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.createdAt));
    }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, input.slug));
      return post || null;
    }),
});
