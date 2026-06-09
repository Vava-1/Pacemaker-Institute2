import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getDb } from "./queries/connection";
import { verifyAccessToken } from "./lib/auth";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "user" | "instructor" | "admin";
  avatar: string | null;
  isSuspended: boolean;
  studyStreak: number;
}

export interface Context {
  user: User | null;
  db: ReturnType<typeof getDb>;
  requestId: string;
}

export async function createContext(
  opts: FetchCreateContextFnOptions & { req: Request }
): Promise<Context> {
  const requestId = opts.req.headers.get("X-Request-ID") || crypto.randomUUID();
  const db = getDb();
  
  try {
    const authHeader = opts.req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      return { user: null, db, requestId };
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return { user: null, db, requestId };
    }

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        isSuspended: users.isSuspended,
        studyStreak: users.studyStreak,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (userRows.length === 0) {
      return { user: null, db, requestId };
    }

    return {
      user: userRows[0] as User,
      db,
      requestId,
    };
  } catch {
    return { user: null, db, requestId };
  }
}
