import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI (migrate, db pull, studio) needs a real Postgres connection.
// Supabase "Transaction" pooler (:6543) does not support migrations and often hangs.
// Set DIRECT_URL to the direct host (db.<project>.supabase.co:5432) from the Supabase dashboard.
// Runtime still uses DATABASE_URL in src/lib/db/prisma.ts (pooled URL is fine there).
const directUrl = process.env.DIRECT_URL?.trim();
const datasourceUrl = directUrl ? directUrl : env("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
