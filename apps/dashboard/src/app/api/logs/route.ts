import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/clickhouse";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? "demo";
  const level = searchParams.get("level");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const hours = Number(searchParams.get("hours") ?? 24);

  const conditions = [
    `project_id = '${projectId.replace(/'/g, "")}'`,
    `timestamp >= now() - INTERVAL ${hours} HOUR`,
  ];
  if (level) conditions.push(`level = '${level.replace(/'/g, "")}'`);
  if (search) conditions.push(`message ILIKE '%${search.replace(/'/g, "")}%'`);

  const sql = `
    SELECT timestamp, level, message, service, trace_id, meta
    FROM logs
    WHERE ${conditions.join(" AND ")}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  const rows = await query(sql);
  return NextResponse.json(rows);
}
