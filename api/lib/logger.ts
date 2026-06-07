import { env } from "./env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const activeLevel: LogLevel = (env.logLevel as LogLevel) || "info";
const threshold = LEVELS[activeLevel] ?? LEVELS.info;

function ts(): string {
  return new Date().toISOString();
}

function fmt(level: LogLevel, args: unknown[]): unknown[] {
  return [`[${ts()}] [${level.toUpperCase()}]`, ...args];
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= threshold;
}

async function sendWebhook(payload: Record<string, unknown>): Promise<void> {
  if (!env.errorWebhookUrl) return;
  try {
    await fetch(env.errorWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Never let logger errors crash the app
  }
}

export const logger = {
  debug(...args: unknown[]): void {
    if (shouldLog("debug")) console.debug(...fmt("debug", args));
  },
  info(...args: unknown[]): void {
    if (shouldLog("info")) console.info(...fmt("info", args));
  },
  warn(...args: unknown[]): void {
    if (shouldLog("warn")) console.warn(...fmt("warn", args));
  },
  error(...args: unknown[]): void {
    if (!shouldLog("error")) return;
    console.error(...fmt("error", args));
    if (env.isProduction) {
      void sendWebhook({
        level: "error",
        timestamp: new Date().toISOString(),
        source: "pacemaker-backend",
        message: args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
      });
    }
  },
  child(context: Record<string, unknown>) {
    const wrap = (level: LogLevel) => (...args: unknown[]) => {
      logger[level](...args, { context });
    };
    return {
      debug: wrap("debug"),
      info: wrap("info"),
      warn: wrap("warn"),
      error: wrap("error"),
    };
  },
};

export type Logger = typeof logger;
