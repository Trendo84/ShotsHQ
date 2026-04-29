import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
}

const sql = neon(url ?? "postgres://localhost:5432/placeholder");
export const db = drizzle({ client: sql, schema });
export type Db = typeof db;
export { schema };
