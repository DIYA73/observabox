import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/clickhouse";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? "demo";
  const name = searchParams.get("name");
  const hours = Number(searchParams.get("hours") ?? 6);

  const nameFilter = name
    ? `AND name = '${name.replace(/'/g, "")}'`
    : "";

  // Time-series bucketed per minute
  const sql = `
    SELECT
      toStartOfMinute(timestamp) AS bucket,
      name,
      type,
      avg(value)  AS avg_value,
      max(value)  AS max_value,
      min(value)  AS min_value,
      count()     AS sample_count
    FROM metrics
    WHERE project_id = '${projectId.replace(/'/g, "")}'
      AND timestamp >= now() - INTERVAL ${hours} HOUR
      ${nameFilter}
    GROUP BY bucket, name, type
    ORDER BY bucket ASC
  `;

  const rows = await query(sql);
  return NextResponse.json(rows);
}
