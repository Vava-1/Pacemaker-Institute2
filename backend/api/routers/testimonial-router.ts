import { createRouter, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { testimonials } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export const testimonialRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  }),

  featured: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(testimonials).where(eq(testimonials.isFeatured, true)).orderBy(desc(testimonials.createdAt));
  }),
});
