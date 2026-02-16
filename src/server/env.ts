import { z } from "zod/v4";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().min(1).default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  // Call window configuration
  CALL_WINDOW_START: z.string().default("09:00"),
  CALL_WINDOW_END: z.string().default("17:00"),
  CALL_WINDOW_TZ: z.string().default("America/New_York"),
  CALL_GAP_SECONDS: z.coerce.number().default(10),
  // Twilio Conversational Intelligence (optional — enables enriched transcripts)
  TWILIO_INTELLIGENCE_SERVICE_SID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
