import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let pool: mysql.Pool | null = null;
let instance: any = null;

function parseConnectionString(url: string): mysql.ConnectionOptions {
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

// Internal Railway hostnames and localhost never need SSL
function requiresSsl(host?: string): boolean {
  if (!host) return false;
  if (host.endsWith(".railway.internal")) return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  return env.isProduction;
}

export function createPool(): mysql.Pool {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const connParams = parseConnectionString(env.databaseUrl);
  const useSSL = requiresSsl(connParams.host as string);

  logger.info("Creating MySQL connection pool", {
    host: connParams.host,
    port: connParams.port,
    database: connParams.database,
    ssl: useSSL ? "enabled" : "disabled (internal/local)",
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
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
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
