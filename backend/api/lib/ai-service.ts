import { env } from "./env";
import { logger } from "./logger";

export type AIModel = "gemini" | "grok" | "deepseek" | "claude";

interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AiResponse {
  content: string;
  model: AIModel;
  usage: { inputTokens: number; outputTokens: number };
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

function detectModel(message: string, discipline?: string): AIModel {
  const lower = message.toLowerCase();
  const codeKeywords = /\b(code|javascript|typescript|python|react|function|debug|error|algorithm|sql|api)\b/i;
  const mathKeywords = /\b(math|equation|solve|calculate|derivative|integral|proof)\b/i;
  const langKeywords = /\b(translate|french|spanish|german|italian|grammar|vocabulary|pronunciation)\b/i;
  const longContent = message.length > 2000;

  if (langKeywords.test(lower)) return "gemini";
  if (discipline === "ai-skills" || codeKeywords.test(lower)) return "grok";
  if (mathKeywords.test(lower)) return "grok";
  if (longContent) return "deepseek";
  return "grok";
}

async function callGemini(messages: AiMessage[]): Promise<AiResponse> {
  const key = env.geminiApiKey;
  if (!key) throw new Error("Gemini API key not configured");

  const body = {
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    logger.error("Gemini API error", { status: res.status, body: text });
    throw new Error(`Gemini API returned ${res.status}`);
  }

  const json: any = await res.json();
  return {
    content: json.choices?.[0]?.message?.content ?? "No response from Gemini.",
    model: "gemini",
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

async function callGrok(messages: AiMessage[]): Promise<AiResponse> {
  const key = env.grokApiKey;
  if (!key) throw new Error("Grok API key not configured");

  const body = {
    model: "grok-2-latest",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("Grok API error", { status: res.status, body: text });
    throw new Error(`Grok API returned ${res.status}`);
  }

  const json: any = await res.json();
  return {
    content: json.choices?.[0]?.message?.content ?? "No response from Grok.",
    model: "grok",
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

async function callDeepSeek(messages: AiMessage[]): Promise<AiResponse> {
  const key = env.deepseekApiKey;
  if (!key) throw new Error("DeepSeek API key not configured");

  const body = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("DeepSeek API error", { status: res.status, body: text });
    throw new Error(`DeepSeek API returned ${res.status}`);
  }

  const json: any = await res.json();
  return {
    content: json.choices?.[0]?.message?.content ?? "No response from DeepSeek.",
    model: "deepseek",
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

async function callClaude(messages: AiMessage[]): Promise<AiResponse> {
  const key = env.anthropicApiKey;
  if (!key) throw new Error("Anthropic API key not configured");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: key });

  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    temperature: 0.7,
  });

  const content =
    response.content[0]?.type === "text"
      ? response.content[0].text
      : "I'm sorry, I couldn't process that request.";

  return {
    content,
    model: "claude",
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}

function getFallbackChain(model: AIModel): AIModel[] {
  const order: Record<AIModel, AIModel[]> = {
    gemini: ["gemini", "deepseek", "grok", "claude"],
    grok: ["grok", "deepseek", "gemini", "claude"],
    deepseek: ["deepseek", "grok", "gemini", "claude"],
    claude: ["claude", "deepseek", "grok", "gemini"],
  };
  return order[model] ?? [model, "deepseek", "grok"];
}

export async function sendMessage(params: {
  messages: AiMessage[];
  model?: AIModel;
  discipline?: string;
}): Promise<AiResponse> {
  const preferredModel = params.model ?? detectModel(
    params.messages[params.messages.length - 1]?.content ?? "",
    params.discipline,
  );

  const callers: Record<AIModel, (msgs: AiMessage[]) => Promise<AiResponse>> = {
    gemini: callGemini,
    grok: callGrok,
    deepseek: callDeepSeek,
    claude: callClaude,
  };

  const fallbackChain = getFallbackChain(preferredModel);

  let lastError: Error | null = null;
  for (const model of fallbackChain) {
    const caller = callers[model];
    if (!caller) continue;

    try {
      const start = Date.now();
      const result = await caller(params.messages);
      if (model !== preferredModel) {
        logger.info("AI response with fallback", { requested: preferredModel, used: model, latency: Date.now() - start, ...result.usage });
      } else {
        logger.info("AI response", { model, latency: Date.now() - start, ...result.usage });
      }
      return result;
    } catch (err: any) {
      lastError = err;
      logger.warn(`AI model ${model} failed, trying next`, { error: err.message });
    }
  }

  logger.error("AI service error — all models failed", { preferred: preferredModel, error: lastError?.message });
  throw lastError ?? new Error("All AI providers failed to respond");
}

export async function analyzeContent(params: {
  content: string;
  instruction: string;
  model?: AIModel;
}): Promise<string> {
  const model = params.model ?? "deepseek";
  const messages: AiMessage[] = [
    {
      role: "system",
      content: `You are an AI analysis assistant. Follow this instruction carefully: ${params.instruction}`,
    },
    { role: "user", content: params.content },
  ];

  const result = await sendMessage({ messages, model });
  return result.content;
}

export async function generateExercises(params: {
  topic: string;
  count?: number;
  difficulty?: string;
  language?: string;
}): Promise<string> {
  const count = params.count ?? 3;
  const difficulty = params.difficulty ?? "intermediate";
  const grade = params.language ? `The exercises should be in ${params.language}.` : "";

  const prompt = `Generate ${count} ${difficulty}-level practice exercises about "${params.topic}". ${grade}
For each exercise, provide:
1. The question
2. The correct answer
3. A brief explanation
4. The difficulty level

Format as JSON array with fields: question, answer, explanation, difficulty.

Return ONLY valid JSON, no other text.`;

  const result = await sendMessage({
    messages: [{ role: "user", content: prompt }],
    model: "grok",
  });

  return result.content;
}
