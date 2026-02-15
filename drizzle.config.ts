import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/lib/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
