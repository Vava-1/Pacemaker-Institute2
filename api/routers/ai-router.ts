import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { aiConversations } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env";
import { TRPCError } from "@trpc/server";

const disciplinePrompts: Record<string, string> = {
  languages: "You are PI Assistant, a language tutor at Pacemaker Institute. Help the student learn their target language. Provide explanations in both their native language and the target language. Be encouraging and adapt to their level.",
  "exam-prep": "You are PI Assistant, an exam preparation coach at Pacemaker Institute. Help the student prepare for their exam with strategies, practice questions, and detailed explanations. Focus on test-taking techniques.",
  mechanics: "You are PI Assistant, a technical skills tutor at Pacemaker Institute. Explain mechanical concepts clearly with step-by-step procedures. Emphasize safety protocols.",
  bakery: "You are PI Assistant, a professional baking instructor at Pacemaker Institute. Provide detailed recipes, techniques, and troubleshooting advice.",
  salon: "You are PI Assistant, a beauty and salon instructor at Pacemaker Institute. Teach professional techniques for hair, nails, and skincare.",
  "ai-skills": "You are PI Assistant, an AI skills coach at Pacemaker Institute. Help the student leverage AI tools for their profession with practical examples.",
  general: "You are PI Assistant, the AI tutor at Pacemaker Institute. You help students with their learning journey across all disciplines. Provide clear, helpful explanations and encourage active learning.",
};

export const aiRouter = createRouter({
  chat: authedQuery
    .input(z.object({
      message: z.string().min(1),
      discipline: z.string().default("general"),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const systemPrompt = disciplinePrompts[input.discipline] ?? disciplinePrompts.general;

      if (!env.anthropicApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables or platform settings.",
        });
      }

      const anthropic = new Anthropic({
        apiKey: env.anthropicApiKey,
      });

      let conversationId: number;
      let messages: any[] = [];

      if (input.conversationId) {
        const convs = await db.select().from(aiConversations)
          .where(eq(aiConversations.id, input.conversationId));
        if (convs[0]) {
          conversationId = convs[0].id;
          // Filter out the system prompt from stored messages for Anthropic
          messages = (convs[0].messages as any[]).filter(m => m.role !== "system");
          messages.push({ role: "user", content: input.message });
          
          // We'll update the DB after we get the response
        } else {
          conversationId = await createNewConversation(db, ctx.user.id, input.discipline, input.message);
          messages = [{ role: "user", content: input.message }];
        }
      } else {
        conversationId = await createNewConversation(db, ctx.user.id, input.discipline, input.message);
        messages = [{ role: "user", content: input.message }];
      }

      try {
        const aiResponse = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        const replyContent = aiResponse.content[0].type === "text" 
          ? aiResponse.content[0].text 
          : "I'm sorry, I couldn't process that.";

        messages.push({ role: "assistant", content: replyContent });

        // Include system prompt back when saving to DB for history
        const messagesToSave = [{ role: "system", content: systemPrompt }, ...messages];

        await db.update(aiConversations)
          .set({ messages: messagesToSave })
          .where(eq(aiConversations.id, conversationId));

        return { response: replyContent, conversationId };
      } catch (error) {
        console.error("AI Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to communicate with AI tutor. Please try again later.",
        });
      }
    }),

  history: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(aiConversations)
      .where(eq(aiConversations.userId, ctx.user.id))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(20);
  }),
});

async function createNewConversation(db: any, userId: number, discipline: string, message: string): Promise<number> {
  const result = await db.insert(aiConversations).values({
    userId,
    discipline,
    messages: [{ role: "user", content: message }],
  });
  return Number(result[0]?.insertId ?? 0) || 0;
}
