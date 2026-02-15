import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.ts";
import { env } from "../env.ts";
import * as schema from "./schema.ts";
import { sendPasswordResetEmail } from "./email.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  baseURL: env.BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    env.BASE_URL,
    // Allow Vite dev server origin in development
    ...(env.BASE_URL.includes("localhost") ? ["http://localhost:5173"] : []),
  ],
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
