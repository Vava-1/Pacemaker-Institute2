import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let pool: mysql.Pool | null = null;
let instance: any = null;

export function createPool(): mysql.Pool | null {
  if (!env.databaseUrl) {
    logger.warn("DATABASE_URL is not configured — running without database");
    return null;
  }

  try {
    return mysql.createPool({
      uri: env.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 10000,
      idleTimeout: 600000,
      ssl: env.isProduction ? { rejectUnauthorized: false } : undefined,
    } as mysql.PoolOptions);
  } catch (err: any) {
    logger.error("Failed to create database pool", { error: err.message });
    return null;
  }
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

export function getPool(): mysql.Pool | null {
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
    return { ok: false, error: err.message };
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    instance = null;
  }
}
