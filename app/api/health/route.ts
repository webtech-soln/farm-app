import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * What a load balancer, a deploy gate or an uptime check should poll.
 *
 * Deliberately unauthenticated — a probe has no session — and deliberately
 * quiet: it reports whether the process can reach its database and nothing
 * else, because a health endpoint that leaks version numbers, connection
 * strings or row counts is a reconnaissance endpoint.
 *
 * 200 means serving traffic is safe. 503 means take this instance out.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await db.execute(sql`select 1`);

    return NextResponse.json(
      { status: "ok", database: "ok", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("Health check failed", error);

    return NextResponse.json(
      { status: "degraded", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
