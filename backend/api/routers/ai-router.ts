import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { aiConversations } from "@db/schema";
import { sendMessage, analyzeContent, generateExercises } from "../lib/ai-service";
import type { AIModel } from "../lib/ai-service";
import { logger } from "../lib/logger";

const SendMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message must be 4000 characters or less"),
  conversationId: z.string().optional(),
  courseId: z.number().positive().optional(),
  lessonId: z.number().positive().optional(),
  discipline: z.string().optional(),
  model: z.enum(["gemini", "grok", "deepseek", "claude"]).optional(),
});

const GetHistorySchema = z.object({
  conversationId: z.string(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const BLOCKED_PATTERNS = [
  /\b(hack|crack|exploit|bypass|inject)\b/i,
  /\b(credit card|ssn|social security|password)\b/i,
  /\b(illegal|drug|weapon|bomb)\b/i,
];

function isContentSafe(message: string): boolean {
  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(message));
}

export const aiRouter = createRouter({
  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isContentSafe(input.message)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message contains prohibited content" });
      }

      const db = getDb();
      let conversationId = input.conversationId || crypto.randomUUID();
      const messages: { role: "user" | "assistant"; content: string }[] = [];

      if (input.conversationId) {
        const existing = await db
          .select()
          .from(aiConversations)
          .where(and(eq(aiConversations.id, Number(conversationId)), eq(aiConversations.userId, ctx.user.id)))
          .limit(1);

        if (existing.length > 0) {
          const storedMessages = existing[0].messages as any[];
          messages.push(...storedMessages.slice(-10));
        }
      }

      messages.push({ role: "user", content: input.message });

      try {
        const result = await sendMessage({
          messages,
          model: input.model as AIModel | undefined,
          discipline: input.discipline,
        });

        messages.push({ role: "assistant", content: result.content });

        if (input.conversationId) {
          await db.update(aiConversations).set({
            messages: messages,
            updatedAt: new Date(),
          }).where(eq(aiConversations.id, Number(conversationId)));
        } else {
          const [insertResult] = await db.insert(aiConversations).values({
            userId: ctx.user.id,
            discipline: input.discipline || input.courseId?.toString() || "general",
            messages: messages,
          });
          conversationId = String((insertResult as any).insertId ?? insertResult);
        }

        logger.info("AI tutor message sent", { userId: ctx.user.id, conversationId, model: result.model });

        return {
          message: result.content,
          conversationId,
          model: result.model,
          usage: result.usage,
        };
      } catch (err: any) {
        logger.error("AI tutor error", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Failed to get AI response" });
      }
    }),

  getHistory: protectedProcedure
    .input(GetHistorySchema)
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const rows = await db
        .select()
        .from(aiConversations)
        .where(and(eq(aiConversations.id, Number(input.conversationId)), eq(aiConversations.userId, ctx.user.id)))
        .orderBy(desc(aiConversations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const messages = rows
        .flatMap((r: any) => (r.messages as any[]) || [])
        .reverse();

      return {
        messages,
        total: messages.length,
      };
    }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const conversations = await db
      .select({
        id: aiConversations.id,
        lastMessage: sql`JSON_UNQUOTE(JSON_EXTRACT(messages, CONCAT('$[', JSON_LENGTH(messages) - 1, '].content')))`,
        updatedAt: aiConversations.updatedAt,
        messageCount: sql`JSON_LENGTH(messages)`,
      })
      .from(aiConversations)
      .where(eq(aiConversations.userId, ctx.user.id))
      .orderBy(desc(aiConversations.updatedAt));

    return conversations;
  }),

  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      await db
        .delete(aiConversations)
        .where(and(eq(aiConversations.id, Number(input.conversationId)), eq(aiConversations.userId, ctx.user.id)));

      logger.info("Conversation deleted", { userId: ctx.user.id, conversationId: input.conversationId });

      return { success: true };
    }),

  analyzeContent: protectedProcedure
    .input(z.object({
      content: z.string().min(1).max(50000),
      instruction: z.string().min(1).max(1000),
      model: z.enum(["gemini", "grok", "deepseek", "claude"]).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await analyzeContent({
          content: input.content,
          instruction: input.instruction,
          model: input.model as AIModel | undefined,
        });
        return { result };
      } catch (err: any) {
        logger.error("Content analysis error", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Analysis failed" });
      }
    }),

  generateExercises: protectedProcedure
    .input(z.object({
      topic: z.string().min(1).max(500),
      count: z.number().min(1).max(10).default(3),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      language: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await generateExercises({
          topic: input.topic,
          count: input.count,
          difficulty: input.difficulty,
          language: input.language,
        });
        return { exercises: result };
      } catch (err: any) {
        logger.error("Exercise generation error", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Failed to generate exercises" });
      }
    }),
});
