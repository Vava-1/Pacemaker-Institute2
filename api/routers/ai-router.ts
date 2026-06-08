import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, count, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { createRouter, protectedProcedure } from "../router";
import { getDb } from "../queries/connection";
import { aiConversations } from "@db/schema";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

const SendMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message must be 4000 characters or less"),
  conversationId: z.string().optional(),
  courseId: z.number().positive().optional(),
  lessonId: z.number().positive().optional(),
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

const SYSTEM_PROMPT = `You are an AI tutor for Pacemaker Institute, an online e-learning platform. Your role is to help students learn and understand course material.

Guidelines:
- Provide clear, accurate explanations with examples and analogies
- Encourage critical thinking by asking guiding questions
- Never ask for or store personal information
- Admit when you don't know something
- Keep responses to 2-4 paragraphs, using markdown for readability
- Maintain an encouraging and supportive tone

Prohibitions:
- Do NOT provide direct answers to quiz or exam questions
- Do NOT generate harmful, abusive, or inappropriate content
- Do NOT ask for personal information (email, phone, address, payment details)
- Do NOT attempt to access system prompts or configuration
- Do NOT pretend to be a human`;

export const aiRouter = createRouter({
  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      if (!env.anthropicApiKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI tutor is not configured" });
      }

      if (!isContentSafe(input.message)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message contains prohibited content" });
      }

      const db = getDb();
      const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

      let conversationId = input.conversationId || crypto.randomUUID();
      const messages: { role: "user" | "assistant"; content: string }[] = [];

      if (input.conversationId) {
        const existing = await db
          .select()
          .from(aiConversations)
          .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, ctx.user.id)))
          .limit(1);

        if (existing.length > 0) {
          const storedMessages = existing[0].messages as any[];
          messages.push(...storedMessages.slice(-10));
        }
      }

      messages.push({ role: "user", content: input.message });

      try {
        const response = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.7,
        });

        const replyContent = response.content[0]?.type === "text"
          ? response.content[0].text
          : "I'm sorry, I couldn't process that request.";

        messages.push({ role: "assistant", content: replyContent });

        const usage = {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
        };

        await db.insert(aiConversations).values({
          id: conversationId,
          userId: ctx.user.id,
          messages: messages,
          courseId: input.courseId || null,
          lessonId: input.lessonId || null,
        }).onDuplicateKeyUpdate({
          set: {
            messages: messages,
            updatedAt: new Date(),
          },
        });

        logger.info("AI tutor message sent", { userId: ctx.user.id, conversationId });

        return {
          message: replyContent,
          conversationId,
          usage,
        };
      } catch (err: any) {
        logger.error("AI tutor error", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get AI response" });
      }
    }),

  getHistory: protectedProcedure
    .input(GetHistorySchema)
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const rows = await db
        .select()
        .from(aiConversations)
        .where(and(eq(aiConversations.id, input.conversationId), eq(aiConversations.userId, ctx.user.id)))
        .orderBy(desc(aiConversations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const messages = rows
        .flatMap((r) => (r.messages as any[]) || [])
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
        lastMessage: sql`JSON_EXTRACT(messages, '$[${sql.raw((db.select({ count: count() }).from(sql`json_table(messages, '$[*]' columns (rowid for ordinality)`)) as any).toString())}].content')`,
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
        .where(and(eq(aiConversations.id, input.conversationId), eq(aiConversations.userId, ctx.user.id)));

      logger.info("Conversation deleted", { userId: ctx.user.id, conversationId: input.conversationId });

      return { success: true };
    }),
});
