import { createRouter, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { blogPosts } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const blogRouter = createRouter({
  list: publicQuery
    .input(z.object({ tag: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const condition = eq(blogPosts.published, true);
      const posts = await db
        .select()
        .from(blogPosts)
        .where(condition)
        .orderBy(desc(blogPosts.createdAt));
      if (input?.tag) {
        return posts.filter((p: any) => p.tags?.includes(input.tag));
      }
      return posts;
    }),

  featured: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.featured, true))
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
