import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let pool: mysql.Pool | null = null;
let instance: any = null;
let poolCreateAttempted = false;

export function createPool(): mysql.Pool | null {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  try {
    const url = new URL(env.databaseUrl);
    logger.info("Connecting to database", { host: url.hostname, port: url.port, database: url.pathname.replace(/^\//, "") });

    const p = mysql.createPool({
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      waitForConnections: true,
      connectionLimit: 20,
      maxIdle: 10,
      queueLimit: 0,
      acquireTimeout: 15000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 20000,
      idleTimeout: 600000,
      ssl: env.isProduction ? { rejectUnauthorized: false } : undefined,
    } as mysql.PoolOptions);

    p.on("acquire", () => {
      logger.debug("Connection acquired from pool", {
        poolSize: p.pool ? (p.pool as any).numFree?._value ?? "?" : "?",
      });
    });

    p.on("release", () => {
      logger.debug("Connection returned to pool");
    });

    p.on("connection", () => {
      logger.debug("New connection created");
    });

    p.on("enqueue", () => {
      logger.warn("Connection request queued — all connections in use");
    });

    return p;
  } catch (err: any) {
    logger.error("Failed to create database pool", { error: err.message });
    return null;
  }
}

export async function ensurePool(): Promise<mysql.Pool | null> {
  if (pool) return pool;
  if (poolCreateAttempted && !env.databaseUrl) return null;
  poolCreateAttempted = true;
  pool = createPool();
  if (pool) {
    instance = drizzle(pool, { schema: fullSchema, mode: "default" });
    poolCreateAttempted = false;
  }
  return pool;
}

export function getDb() {
  if (!instance) {
    pool = createPool();
    if (pool) {
      instance = drizzle(pool, { schema: fullSchema, mode: "default" });
    }
  }
  return instance;
}

export async function getDbAsync(): Promise<any> {
  if (instance) return instance;
  await ensurePool();
  return instance;
}

export function getPool(): mysql.Pool | null {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const start = Date.now();
      const p = await ensurePool();
      if (!p) {
        return { ok: false, error: "DATABASE_URL not configured" };
      }
      const connection = await p.getConnection();
      await connection.execute("SELECT 1");
      connection.release();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      if (attempt < maxRetries) {
        logger.warn(`Database health check attempt ${attempt + 1} failed, retrying...`, {
          error: err.message,
        });
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: "Health check failed after retries" };
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    instance = null;
    poolCreateAttempted = false;
  }
}
