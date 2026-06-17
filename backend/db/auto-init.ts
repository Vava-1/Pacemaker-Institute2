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

/**
 * Parse a mysql:// URI into explicit connection options — same logic as
 * connection.ts so both code paths use identical SSL handling.
 */
function parseMigrationConnectionString(url: string): mysql.ConnectionOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
    };
  } catch {
    return { uri: url } as any;
  }
}

function requiresSsl(host?: string): boolean {
  if (!host) return false;
  if (host.endsWith(".railway.internal")) return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  return env.isProduction;
}

export async function autoInitialize() {
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
    const connParams = parseMigrationConnectionString(env.databaseUrl);
    logger.info("Connecting to database for migrations...", {
      host: connParams.host,
      port: connParams.port,
      database: connParams.database,
    });

    // IMPORTANT: Use explicit params + SSL so this works whether DATABASE_URL
    // points to Railway's external proxy (thomas.proxy.rlwy.net) or the internal
    // hostname (pacemaker-db.railway.internal).  Without SSL the external proxy
    // rejects the connection and migrations never run.
    connection = await mysql.createConnection({
      ...connParams,
      ssl: requiresSsl(connParams.host) ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 15000,
    });
    logger.info("Connected to database for migrations");

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

      const statements = sql.split("--> statement-breakpoint").map((s: string) => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await connection.execute(stmt);
      }

      await connection.execute(
        `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
        [hash, entry.when]
      );

      applied++;
      logger.info(`  Applied ${entry.tag}`);
    }

    if (applied > 0) {
      logger.info(`Applied ${applied} migration(s) successfully`);
    } else {
      logger.info("All migrations already applied — database schema is up to date");
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
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack,
    });
  }
}
