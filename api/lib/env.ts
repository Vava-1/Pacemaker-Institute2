import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, defaultValue: string = ""): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  
  // Auth Config
  jwtAccessSecret: optional("JWT_ACCESS_SECRET", "dev_access_secret_do_not_use_in_prod"),
  jwtRefreshSecret: optional("JWT_REFRESH_SECRET", "dev_refresh_secret_do_not_use_in_prod"),
  
  // Frontend
  frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  
  // These will primarily be loaded from DB settings in prod, but env acts as fallback/initial config
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: optional("GOOGLE_CALLBACK_URL", "http://localhost:3000/api/oauth/google/callback"),
  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  cloudinaryUrl: optional("CLOUDINARY_URL"),
};
