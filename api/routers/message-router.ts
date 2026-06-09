import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { messages, chatRooms } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const messageRouter = createRouter({
  rooms: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(chatRooms).orderBy(chatRooms.createdAt);
  }),

  listByRoom: publicQuery
    .input(z.object({ roomId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(messages)
        .where(eq(messages.roomId, input.roomId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit);
    }),

  send: authedQuery
    .input(z.object({
      roomId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(messages).values({
        roomId: input.roomId,
        senderId: ctx.user.id,
        content: input.content,
      });
      return { success: true };
    }),

  myMessages: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(messages)
      .where(eq(messages.senderId, ctx.user.id))
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }),
});
