import type { Config } from "drizzle-kit";

const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error("No database URL configured (SUPABASE_DATABASE_URL or DATABASE_URL)");
}

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
