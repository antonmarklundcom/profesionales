import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Single shared pool. Hostinger MySQL caps concurrent connections per user, so
 * keep connectionLimit small and never create a pool per request.
 *
 * The pool is created lazily on first query: `next build` imports every route
 * module to collect page data, and CI builds with no database must not fail
 * there. A route that actually queries without DATABASE_URL throws at request
 * time with the message below.
 */
const globalForDb = globalThis as unknown as {
  __pool?: mysql.Pool;
  __db?: MySql2Database<typeof schema>;
};

function createPool(): mysql.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in (see README §Database).",
    );
  }
  return mysql.createPool({ uri: url, connectionLimit: 8, timezone: "Z" });
}

function getPool(): mysql.Pool {
  if (!globalForDb.__pool) globalForDb.__pool = createPool();
  return globalForDb.__pool;
}

function getDb(): MySql2Database<typeof schema> {
  if (!globalForDb.__db) globalForDb.__db = drizzle(getPool(), { schema, mode: "default" });
  return globalForDb.__db;
}

export type Db = MySql2Database<typeof schema>;

/** Behaves exactly like a Drizzle client; connects on the first property access. */
export const db: Db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

/** Closes the pool. Only scripts need this — the server keeps it open. */
export const pool = {
  end: async () => {
    if (globalForDb.__pool) {
      await globalForDb.__pool.end();
      globalForDb.__pool = undefined;
      globalForDb.__db = undefined;
    }
  },
};

export { schema };
