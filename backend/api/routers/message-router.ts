import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { messages, chatRooms, users } from "../../db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";

export const messageRouter = createRouter({
  rooms: publicProcedure.query(async () => {
    const db = getDb();
    return db.select({
      id: chatRooms.id,
      name: chatRooms.name,
      slug: chatRooms.slug,
      description: chatRooms.description,
      category: chatRooms.category,
      lastActivity: chatRooms.lastActivity,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.id > 0)`,
    }).from(chatRooms).orderBy(desc(chatRooms.lastActivity));
  }),

  listByRoom: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select({
        id: messages.id,
        roomId: messages.roomId,
        senderId: messages.senderId,
        content: messages.content,
        replyToId: messages.replyToId,
        reactions: messages.reactions,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderAvatar: users.avatar,
        senderRole: users.role,
      })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.roomId, input.roomId))
        .orderBy(desc(messages.id))
        .limit(input.limit);

      const rowsAny: any[] = rows as any;

      const replyIds: number[] = [];
      for (const r of rowsAny) {
        if (r.replyToId) replyIds.push(r.replyToId);
      }

      const replyMap = new Map<number, { content: string; senderName: string | null }>();
      if (replyIds.length > 0) {
        const replies = await db.select({
          id: messages.id,
          content: messages.content,
          senderName: users.name,
        })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(inArray(messages.id, replyIds));
        for (const r of replies) {
          replyMap.set(r.id, { content: r.content, senderName: r.senderName });
        }
      }

      return {
        messages: rowsAny.map((r: any) => ({
          ...r,
          replyPreview: r.replyToId ? replyMap.get(r.replyToId) ?? null : null,
        })),
        hasMore: rows.length >= input.limit,
      };
    }),

  send: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      content: z.string().min(1).max(2000),
      replyToId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [result] = await db.insert(messages).values({
        roomId: input.roomId,
        senderId: ctx.user.id,
        content: input.content,
        replyToId: input.replyToId,
        reactions: [],
      });
      await db.update(chatRooms).set({ lastActivity: new Date() }).where(eq(chatRooms.id, input.roomId));
      return { id: Number(result.insertId), success: true };
    }),

  react: protectedProcedure
    .input(z.object({
      messageId: z.number(),
      emoji: z.string().length(1).or(z.string().length(2)),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const msgRows = await db.select().from(messages).where(eq(messages.id, input.messageId)).limit(1);
      if (msgRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }
      const msg = msgRows[0];
      const current: { emoji: string; userId: number }[] = (msg.reactions ?? []) as any;
      const existing = current.findIndex(r => r.userId === ctx.user.id && r.emoji === input.emoji);
      let updated: { emoji: string; userId: number }[];
      if (existing >= 0) {
        updated = current.filter((_, i) => i !== existing);
      } else {
        updated = [...current, { emoji: input.emoji, userId: ctx.user.id }];
      }
      await db.update(messages).set({ reactions: updated as any }).where(eq(messages.id, input.messageId));
      return { success: true, reactions: updated };
    }),

  delete: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const msgRows = await db.select().from(messages).where(eq(messages.id, input.messageId)).limit(1);
      if (msgRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }
      if (msgRows[0].senderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete another user's message" });
      }
      await db.delete(messages).where(eq(messages.id, input.messageId));
      return { success: true };
    }),
});

