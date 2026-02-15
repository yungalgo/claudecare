import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";

const driver = postgres(process.env.DATABASE_URL ?? "postgresql://localhost:5432/claudecare");
export const db = drizzle({ client: driver, schema, casing: "snake_case" });
export { schema };
