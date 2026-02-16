import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";
import { env } from "../env.ts";

const driver = postgres(env.DATABASE_URL);
export const db = drizzle({ client: driver, schema, casing: "snake_case" });
export { schema };
