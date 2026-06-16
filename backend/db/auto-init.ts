import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import { getDb } from "../api/queries/connection";
import { logger } from "../api/lib/logger";
import { users } from "./schema";
import { seedDatabase } from "./seed";

export async function autoInitialize() {
  const db = getDb();
  if (!db) {
    logger.warn("Database not configured, skipping auto-initialization");
    return;
  }

  // Step 1: Run pending migrations
  try {
    logger.info("Running database migrations...");
    const migrationsFolder = path.resolve(process.cwd(), "backend/db/migrations");
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations completed");
  } catch (err: any) {
    logger.error("Migration failed, continuing startup", { error: err.message });
    return;
  }

  // Step 2: Seed if database is empty
  try {
    const [existingUser] = await db.select().from(users).limit(1);
    if (!existingUser) {
      logger.info("Database is empty, seeding initial data...");
      await seedDatabase();
      logger.info("Database seeding completed");
    } else {
      logger.info("Database already contains data, skipping seed");
    }
  } catch (err: any) {
    logger.error("Seeding failed, continuing startup", { error: err.message });
  }
}
