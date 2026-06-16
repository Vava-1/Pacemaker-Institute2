import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional().or(z.literal("")),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional().or(z.literal("")),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional().or(z.literal("")),
  GOOGLE_CLIENT_ID: z.string().min(1).optional().or(z.literal("")),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().or(z.literal("")),
  GOOGLE_CALLBACK_URL: z.string().url().optional().or(z.literal("")),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional().or(z.literal("")),
  GROK_API_KEY: z.string().min(1, "GROK_API_KEY is required").optional().or(z.literal("")),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required").optional().or(z.literal("")),
  DEEPSEEK_API_KEY: z.string().startsWith("sk-").optional().or(z.literal("")),
  CLOUDINARY_URL: z.string().url().optional().or(z.literal("")),
  SMTP_HOST: z.string().optional().or(z.literal("")),
  SMTP_PORT: z.string().regex(/^\d+$/).optional().or(z.literal("")),
  SMTP_USER: z.string().optional().or(z.literal("")),
  SMTP_PASSWORD: z.string().optional().or(z.literal("")),
  SMTP_FROM_NAME: z.string().optional().or(z.literal("Pacemaker Institute")),
  SMTP_FROM_EMAIL: z.string().email().optional().or(z.literal("noreply@pacemakerinstitute.com")),
  ERROR_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default("60000"),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).default("100"),
  OWNER_UNION_ID: z.string().optional().or(z.literal("")),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional().or(z.literal("")),
  RAILWAY_HOSTNAME: z.string().optional().or(z.literal("")),
});

export type Env = z.infer<typeof EnvSchema>;

function parseAndValidate(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    const banner = `
================================================================
  ENVIRONMENT CONFIGURATION ERROR
================================================================
The following required environment variables are missing or invalid:

${issues}

How to fix:
  1. Copy .env.example to .env (cp .env.example .env)
  2. Fill in the values shown above
  3. See DEPLOYMENT.md for instructions on where to obtain each key.

  Quick reference for the most common ones:
    DATABASE_URL      -> Your MySQL connection string
    JWT_ACCESS_SECRET -> Any random 32+ char string (e.g. openssl rand -hex 32)
    JWT_REFRESH_SECRET-> Another random 32+ char string
================================================================
`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(banner);
    } else {
      console.error(banner);
    }
  }

  const fallback: Env = {
    NODE_ENV: "development",
    PORT: "3000",
    DATABASE_URL: "",
    JWT_ACCESS_SECRET: "dev_access_secret_do_not_use_in_prod_xxxxx",
    JWT_REFRESH_SECRET: "dev_refresh_secret_do_not_use_in_prod_xxxxx",
    FRONTEND_URL: "http://localhost:5173",
    LOG_LEVEL: "info",
    RATE_LIMIT_WINDOW_MS: "60000",
    RATE_LIMIT_MAX: "100",
  } as Env;

  return (result.success ? result.data : fallback) as Env;
}

const parsed = parseAndValidate();

const isProduction = parsed.NODE_ENV === "production";

function derivePublicUrl(): string {
  if (isProduction && !parsed.FRONTEND_URL) {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    if (process.env.RAILWAY_HOSTNAME) return `https://${process.env.RAILWAY_HOSTNAME}`;
    if (process.env.RENDER_EXTERNAL_HOSTNAME) return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }
  const url = parsed.FRONTEND_URL;
  if (url === "http://localhost:5173" && process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return url;
}

function deriveGoogleCallback(): string {
  if (parsed.GOOGLE_CALLBACK_URL) return parsed.GOOGLE_CALLBACK_URL;
  const base = derivePublicUrl();
  return `${base.replace(/\/$/, "")}/api/oauth/google/callback`;
}

export const env = {
  isProduction,
  isDevelopment: !isProduction,
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
  frontendUrl: derivePublicUrl(),
  stripeSecretKey: parsed.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: parsed.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: parsed.STRIPE_PUBLISHABLE_KEY ?? "",
  googleClientId: parsed.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: parsed.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl: deriveGoogleCallback(),
  anthropicApiKey: parsed.ANTHROPIC_API_KEY ?? "",
  grokApiKey: parsed.GROK_API_KEY ?? "",
  geminiApiKey: parsed.GEMINI_API_KEY ?? "",
  deepseekApiKey: parsed.DEEPSEEK_API_KEY ?? "",
  cloudinaryUrl: parsed.CLOUDINARY_URL ?? "",
  smtpHost: parsed.SMTP_HOST ?? "",
  smtpPort: parsed.SMTP_PORT ?? "",
  smtpUser: parsed.SMTP_USER ?? "",
  smtpPassword: parsed.SMTP_PASSWORD ?? "",
  smtpFromName: parsed.SMTP_FROM_NAME ?? "Pacemaker Institute",
  smtpFromEmail: parsed.SMTP_FROM_EMAIL ?? "noreply@pacemakerinstitute.com",
  errorWebhookUrl: parsed.ERROR_WEBHOOK_URL ?? "",
  ownerUnionId: parsed.OWNER_UNION_ID ?? "",
  logLevel: parsed.LOG_LEVEL,
  sentryDsn: parsed.SENTRY_DSN ?? "",
  rateLimitWindowMs: parseInt(parsed.RATE_LIMIT_WINDOW_MS),
  rateLimitMax: parseInt(parsed.RATE_LIMIT_MAX),
};
