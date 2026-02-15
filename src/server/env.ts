import { z } from "zod/v4";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  RESEND_API_KEY: z.string(),
});

function getEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    console.warn(`[env] Missing env vars: ${missing} — running with defaults where possible`);
    // In dev, allow partial env
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://localhost:5432/claudecare",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "dev-secret",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    });
  }
  return result.data;
}

export const env = getEnv();
