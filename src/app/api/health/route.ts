import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Used after every Hostinger deploy to tell "app is up" from "DB is reachable". */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    return NextResponse.json(
      { status: "degraded", database: "unreachable", detail: (error as Error).message },
      { status: 503 },
    );
  }
}
