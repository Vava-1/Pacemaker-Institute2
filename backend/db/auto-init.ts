import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { getDb } from "../api/queries/connection";
import { logger } from "../api/lib/logger";
import { env } from "../api/lib/env";
import { users } from "./schema";

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

/**
 * Returns true if the 'users' table physically exists in the current database.
 * Used as a sentinel to detect schema/journal drift (migration records exist
 * but the schema was never actually written to this DB instance).
 */
async function usersTableExists(connection: mysql.Connection): Promise<boolean> {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'users'`
  );
  return Number((rows as any[])[0]?.cnt ?? 0) > 0;
}

export async function autoInitialize() {
  const migrationsFolder = path.resolve(process.cwd(), "backend/db/migrations");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  if (!fs.existsSync(journalPath)) {
    logger.warn(
      `Migration journal not found at ${journalPath}, skipping migrations`
    );
    return;
  }

  if (!env.databaseUrl) {
    logger.warn("DATABASE_URL not configured, skipping auto-initialization");
    return;
  }

  // ── Step 1: Migrations ────────────────────────────────────────────────────
  //
  // FIX (Bug #3): We throw on failure instead of catching and returning.
  // This lets boot.ts propagate the error so the health check correctly
  // reports "unavailable" and Railway surfaces the real error in the logs.
  //
  let connection: mysql.Connection | null = null;
  try {
    const connParams = parseMigrationConnectionString(env.databaseUrl);
    logger.info("Connecting to database for migrations...", {
      host: connParams.host,
      port: connParams.port,
      database: connParams.database,
    });

    connection = await mysql.createConnection({
      ...connParams,
      ssl: requiresSsl(connParams.host) ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 15_000,
    });
    logger.info("Connected to database for migrations");

    // Ensure the migrations-tracking table exists
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
        \`id\`         bigint unsigned NOT NULL AUTO_INCREMENT,
        \`hash\`       text            NOT NULL,
        \`created_at\` bigint          NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    // Determine the timestamp of the last recorded migration
    const [rows] = await connection.execute(
      `SELECT \`id\`, \`hash\`, \`created_at\`
       FROM \`${MIGRATIONS_TABLE}\`
       ORDER BY \`created_at\` DESC
       LIMIT 1`
    );
    const lastMigration = (rows as any[])[0];
    let lastTimestamp = lastMigration ? Number(lastMigration.created_at) : 0;

    // ── FIX (Bug #2): Schema / journal drift detection ──────────────────────
    //
    // If the tracking table already has entries but the 'users' table doesn't
    // exist, it means migration records were written to a DB that no longer
    // holds the actual schema (e.g. the Railway MySQL volume was reset, or
    // the deploy targeted a different instance on a previous attempt).
    //
    // Resolution: wipe the tracking records and re-apply every migration from
    // scratch so the schema is guaranteed to match the journal.
    //
    if (lastTimestamp > 0) {
      const schemaPresent = await usersTableExists(connection);
      if (!schemaPresent) {
        logger.warn(
          "Migration records exist but the 'users' table is missing. " +
          "The schema is out of sync with the journal. " +
          "Resetting migration history and re-applying all migrations."
        );
        await connection.execute(`DELETE FROM \`${MIGRATIONS_TABLE}\``);
        lastTimestamp = 0;
      }
    }

    // Read the Drizzle journal and apply any pending entries
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

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

      // Execute each statement individually (Drizzle uses breakpoint comments)
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s: string) => s.trim())
        .filter(Boolean);

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
    logger.error("FATAL: database migration failed — aborting startup", {
      error:      err.message,
      code:       err.code,
      errno:      err.errno,
      sqlMessage: err.sqlMessage,
      sqlState:   err.sqlState,
    });
    // Re-throw: boot.ts must not start the HTTP server with a broken schema.
    throw err;
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }

  // ── Step 2: Seed ──────────────────────────────────────────────────────────
  //
  // FIX (Bug #1): seed.ts is loaded via a DYNAMIC import here, not a static
  // import at the top of the file.
  //
  // The original static `import { seedDatabase } from "./seed"` caused seed.ts
  // to be evaluated at module-load time — before autoInitialize() was ever
  // called — which is why "Seeding users..." appeared in the logs before
  // "Connecting to database for migrations". The bare console.logs and any
  // module-level code in seed.ts ran immediately on import, against a DB that
  // had no tables yet.
  //
  // The dynamic import below defers evaluation of seed.ts until we know:
  //   (a) migrations completed successfully, and
  //   (b) we are actually inside this function (not at module load time).
  //
  try {
    const db = getDb();
    if (!db) {
      logger.warn("Database ORM instance unavailable — skipping seed");
      return;
    }

    // Check whether any users already exist (idempotency guard)
    const existingRows = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);

    if (existingRows.length > 0) {
      logger.info("Database already contains data — skipping seed");
      return;
    }

    logger.info("Database is empty — seeding initial data...");

    // Dynamic import: only evaluated now, after schema is confirmed present
    const { seedDatabase } = await import("./seed");
    await seedDatabase();

    logger.info("Database seeding completed");
  } catch (err: any) {
    // Seeding failure is non-fatal: the server can still start, and the admin
    // account can be created through the UI. We log clearly and move on.
    logger.error("Database seeding failed — continuing startup", {
      error:      err.message,
      code:       err.code,
      sqlMessage: err.sqlMessage,
      stack:      err.stack,
    });
  }
}
