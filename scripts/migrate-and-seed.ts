import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as schema from "../backend/db/schema";

async function main() {
  console.log("========================================");
  console.log("  MIGRATE & SEED SCRIPT");
  console.log("========================================");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log(`Connecting to: ${databaseUrl.replace(/:([^:@]+)@/, ":****@")}`);

  let connection;
  try {
    connection = await mysql.createConnection(databaseUrl);
    console.log("✅ Connected to database");
  } catch (err: any) {
    console.error("❌ Failed to connect:", err.message);
    process.exit(1);
  }

  // Check what tables exist before migration
  try {
    const [rows] = await connection.execute("SHOW TABLES");
    const tablesBefore = (rows as any[]).map((r: any) => Object.values(r)[0]);
    console.log(`Tables before migration: ${tablesBefore.length === 0 ? "none" : tablesBefore.join(", ")}`);
  } catch (err: any) {
    console.warn("Could not list tables:", err.message);
  }

  const db = drizzle(connection, { schema, mode: "default" });

  // Run migrations
  try {
    console.log("\nRunning migrations...");
    await migrate(db, { migrationsFolder: "./backend/db/migrations" });
    console.log("✅ Migrations completed");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    console.error(err.stack);
    await connection.end();
    process.exit(1);
  }

  // Verify tables after migration
  try {
    const [rows] = await connection.execute("SHOW TABLES");
    const tablesAfter = (rows as any[]).map((r: any) => Object.values(r)[0]);
    console.log(`\nTables after migration: ${tablesAfter.join(", ")}`);
  } catch (err: any) {
    console.warn("Could not list tables:", err.message);
  }

  // Seed if users table is empty
  try {
    const [userRows] = await connection.execute("SELECT COUNT(*) as count FROM users");
    const count = (userRows as any[])[0]?.count ?? 0;
    if (count === 0) {
      console.log("\nSeeding initial data...");
      const { seedDatabase } = await import("../backend/db/seed");
      await seedDatabase();
      console.log("✅ Seeding completed");
    } else {
      console.log(`\nUsers table has ${count} rows, skipping seed`);
    }
  } catch (err: any) {
    console.warn("Seed check failed (table may not exist yet), skipping:", err.message);
  }

  await connection.end();
  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
