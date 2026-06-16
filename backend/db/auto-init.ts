import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { getDb } from "../api/queries/connection";
import { logger } from "../api/lib/logger";
import { env } from "../api/lib/env";
import { users } from "./schema";
import { seedDatabase } from "./seed";

const MIGRATIONS_TABLE = "__drizzle_migrations";

async function executeMigrationSql(connection: mysql.Connection, sql: string) {
  const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await connection.execute(stmt);
  }
}

export async function autoInitialize() {
  // Step 1: Run pending migrations using a direct connection
  // (bypasses drizzle's session to avoid DrizzleQueryError wrapping)
  const migrationsFolder = path.resolve(process.cwd(), "backend/db/migrations");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  if (!fs.existsSync(journalPath)) {
    logger.warn(`Migration journal not found at ${journalPath}, skipping migrations`);
    return;
  }

  if (!env.databaseUrl) {
    logger.warn("DATABASE_URL not configured, skipping auto-initialization");
    return;
  }

  let connection: mysql.Connection | null = null;
  try {
    logger.info("Connecting to database for migrations...");
    connection = await mysql.createConnection(env.databaseUrl);
    logger.info("Connected, running migrations...");

    // Create migrations tracking table if needed
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`hash\` text NOT NULL,
        \`created_at\` bigint NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    // Get last applied migration timestamp
    const [rows] = await connection.execute(
      `SELECT \`id\`, \`hash\`, \`created_at\` FROM \`${MIGRATIONS_TABLE}\` ORDER BY \`created_at\` DESC LIMIT 1`
    );
    const lastMigration = (rows as any[])[0];
    const lastTimestamp = lastMigration ? Number(lastMigration.created_at) : 0;

    // Read journal
    const journalRaw = fs.readFileSync(journalPath, "utf-8");
    const journal = JSON.parse(journalRaw);

    let applied = 0;
    for (const entry of journal.entries) {
      if (entry.when <= lastTimestamp) {
        logger.info(`  Skipping ${entry.tag} (already applied)`);
        continue;
      }

      const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`Migration file not found: ${sqlPath}`);
      }

      const sql = fs.readFileSync(sqlPath, "utf-8");
      const hash = crypto.createHash("sha256").update(sql).digest("hex");

      logger.info(`  Applying ${entry.tag}...`);

      // Execute migration SQL
      const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await connection.execute(stmt);
      }

      // Record as applied
      await connection.execute(
        `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
        [hash, entry.when]
      );

      applied++;
    }

    if (applied > 0) {
      logger.info(`Applied ${applied} migration(s)`);
    } else {
      logger.info("All migrations already applied");
    }
  } catch (err: any) {
    logger.error("Migration failed, continuing startup", {
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
    });
    return;
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }

  // Step 2: Seed if database is empty
  try {
    const db = getDb();
    if (db) {
      const [existingUser] = await db.select().from(users).limit(1);
      if (!existingUser) {
        logger.info("Database is empty, seeding initial data...");
        await seedDatabase();
        logger.info("Database seeding completed");
      } else {
        logger.info("Database already contains data, skipping seed");
      }
    }
  } catch (err: any) {
    logger.error("Seeding failed, continuing startup", {
      error: err.message,
      stack: err.stack,
    });
  }
}
