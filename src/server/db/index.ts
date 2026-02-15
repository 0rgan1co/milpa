import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL is missing. Set DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL) in your environment.",
  );
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
