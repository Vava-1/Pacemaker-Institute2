import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (e.g. mysql://user:pass@host:3306/db)"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),

  CLOUDINARY_URL: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),

  ERROR_WEBHOOK_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
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
  } as Env;

  return (result.success ? result.data : fallback) as Env;
}

const parsed = parseAndValidate();

const isProduction = parsed.NODE_ENV === "production";

function derivePublicUrl(): string {
  // Trust FRONTEND_URL env (Render injects hosturl via render.yaml fromService).
  // Fall back to RENDER_EXTERNAL_HOSTNAME if FRONTEND_URL is missing in production.
  if (isProduction && !parsed.FRONTEND_URL && process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }
  return parsed.FRONTEND_URL;
}

function deriveGoogleCallback(): string {
  if (parsed.GOOGLE_CALLBACK_URL) return parsed.GOOGLE_CALLBACK_URL;
  const base = derivePublicUrl();
  return `${base.replace(/\/$/, "")}/api/oauth/google/callback`;
}

export const env = {
  isProduction,
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

  cloudinaryUrl: parsed.CLOUDINARY_URL ?? "",

  smtpHost: parsed.SMTP_HOST ?? "",
  smtpPort: parsed.SMTP_PORT ?? "",
  smtpUser: parsed.SMTP_USER ?? "",
  smtpPassword: parsed.SMTP_PASSWORD ?? "",
  smtpFromName: parsed.SMTP_FROM_NAME ?? "Pacemaker Institute",
  smtpFromEmail: parsed.SMTP_FROM_EMAIL ?? "noreply@pacemakerinstitute.com",

  errorWebhookUrl: parsed.ERROR_WEBHOOK_URL ?? "",
  logLevel: parsed.LOG_LEVEL,
};
