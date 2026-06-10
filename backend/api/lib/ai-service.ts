import { env } from "./env";
import { logger } from "./logger";

export type AIModel = "gemini" | "grok" | "deepseek";

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
  if (discipline === "ai-skills" || codeKeywords.test(lower)) return "gemini";
  if (mathKeywords.test(lower)) return "gemini";
  if (longContent) return "deepseek";
  return "gemini";
}

async function callGemini(messages: AiMessage[]): Promise<AiResponse> {
  const key = env.geminiApiKey;
  if (!key) throw new Error("Gemini API key not configured");

  const body = {
    model: "gemini-2.5-flash",
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
    model: "grok-beta",
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

function getFallbackChain(model: AIModel): AIModel[] {
  const order: Record<AIModel, AIModel[]> = {
    gemini: ["gemini", "deepseek", "grok"],
    grok: ["grok", "gemini", "deepseek"],
    deepseek: ["deepseek", "gemini", "grok"],
  };
  return order[model] ?? ["gemini", "deepseek", "grok"];
}

async function firstSuccessful<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = 0;
    const errors: Error[] = [];
    for (const p of promises) {
      p.then(resolve, (err: Error) => {
        errors.push(err);
        settled++;
        if (settled === promises.length) reject(errors);
      });
    }
  });
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
  };

  const chain = getFallbackChain(preferredModel).filter((m) => callers[m]);

  const start = Date.now();

  try {
    const result = await firstSuccessful(chain.map((model) => callers[model](params.messages)));
    logger.info("AI response", { model: result.model, latency: Date.now() - start, ...result.usage });
    return result;
  } catch (errors: any) {
    const msgs = (errors as Error[]).map((e) => e.message);
    logger.error("AI service error — all models failed", { preferred: preferredModel, errors: msgs });
    throw new Error(`All AI providers failed: ${msgs.join(" | ")}`);
  }
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
    model: "gemini",
  });

  return result.content;
}
