import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/pacemaker";

export default defineConfig({
  schema: "./backend/db/schema.ts",
  out: "./backend/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
