import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let pool: mysql.Pool | null = null;
let instance: any = null;

/**
 * Parse a mysql:// URI into explicit connection options.
 * Using explicit params instead of the `uri` option avoids a known mysql2
 * issue where SSL options are silently ignored when a connection string is
 * passed as the `uri` key in the options object.
 */
function parseConnectionString(url: string): mysql.ConnectionOptions {
  try {
    const parsed = new URL(url);
    const params: mysql.ConnectionOptions = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
    };
    return params;
  } catch {
    // Fallback: let mysql2 parse it as a connection URI (last resort)
    logger.warn("Could not parse DATABASE_URL as a standard URL — passing raw string to mysql2");
    return { uri: url } as any;
  }
}

export function createPool(): mysql.Pool {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const connParams = parseConnectionString(env.databaseUrl);

  // Log host info for debugging (never log password)
  logger.info("Creating MySQL connection pool", {
    host: connParams.host,
    port: connParams.port,
    database: connParams.database,
    ssl: env.isProduction ? "enabled (rejectUnauthorized: false)" : "disabled",
  });

  return mysql.createPool({
    ...connParams,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
    idleTimeout: 600000,
    // Apply SSL for production regardless of whether the URL is the Railway
    // external proxy (thomas.proxy.rlwy.net) or the internal hostname.
    // The internal Railway hostname (.railway.internal) accepts SSL connections
    // but does not require them; this setting works for both.
    ssl: env.isProduction ? { rejectUnauthorized: false } : undefined,
  } as mysql.PoolOptions);
}

export function getDb() {
  if (!instance) {
    pool = createPool();
    instance = drizzle(pool, { schema: fullSchema, mode: "default" });
  }
  return instance;
}

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  try {
    const start = Date.now();
    const p = getPool();
    const connection = await p.getConnection();
    await connection.execute("SELECT 1");
    connection.release();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    // Unwrap Drizzle wrapper if present to get the real MySQL error
    const cause = err?.cause ?? err;
    return { ok: false, error: cause?.message ?? err?.message ?? String(err) };
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    instance = null;
  }
}
