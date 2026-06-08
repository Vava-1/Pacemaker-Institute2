import { env } from "./env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const threshold = LEVELS[env.logLevel as LogLevel] ?? LEVELS.info;

function ts(): string {
  return new Date().toISOString();
}

function fmt(level: LogLevel, args: unknown[]): unknown[] {
  return [`[${ts()}] [${level.toUpperCase()}]`, ...args];
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= threshold;
}

async function sendToSentry(level: LogLevel, message: string, extra?: Record<string, unknown>): Promise<void> {
  if (!env.sentryDsn) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.withScope((scope) => {
      scope.setLevel(level as any);
      if (extra) scope.setExtras(extra);
      Sentry.captureMessage(message);
    });
  } catch {
    // Never let logging errors crash the app
  }
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
    if (!shouldLog("warn")) return;
    console.warn(...fmt("warn", args));
    if (env.isProduction) {
      const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      void sendToSentry("warning", message);
    }
  },
  error(...args: unknown[]): void {
    if (!shouldLog("error")) return;
    console.error(...fmt("error", args));
    const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    void sendWebhook({
      level: "error",
      timestamp: new Date().toISOString(),
      source: "pacemaker-backend",
      message,
      environment: env.nodeEnv,
      version: "1.0.1",
    });
    if (env.isProduction) {
      void sendToSentry("error", message);
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
  init: {
    sentry: () => {
      if (env.sentryDsn) {
        try {
          import("@sentry/node").then((Sentry) => {
            Sentry.init({
              dsn: env.sentryDsn,
              environment: env.nodeEnv,
              release: `pacemaker-institute@1.0.1`,
              tracesSampleRate: env.isProduction ? 0.1 : 1.0,
              profilesSampleRate: env.isProduction ? 0.1 : 1.0,
            });
            logger.info("Sentry initialized");
          });
        } catch {
          logger.warn("Failed to initialize Sentry");
        }
      }
    },
  },
};

export type Logger = typeof logger;
