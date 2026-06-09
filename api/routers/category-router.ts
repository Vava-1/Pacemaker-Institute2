import { z } from "zod";
import { createRouter, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { categories } from "../../db/schema";
import { eq, isNull } from "drizzle-orm";

export const categoryRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).orderBy(categories.order);
  }),

  listParents: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).where(isNull(categories.parentId)).orderBy(categories.order);
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(categories).where(eq(categories.slug, input.slug));
      return result[0] ?? null;
    }),

  getChildren: publicQuery
    .input(z.object({ parentSlug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const parent = await db.select().from(categories).where(eq(categories.slug, input.parentSlug)).limit(1);
      if (!parent[0]) return [];
      return db.select().from(categories).where(eq(categories.parentId, parent[0].id)).orderBy(categories.order);
    }),
});
