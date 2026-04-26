import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/clickhouse";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? "demo";
  const traceId = searchParams.get("traceId");
  const hours = Number(searchParams.get("hours") ?? 6);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  if (traceId) {
    // Fetch all spans for a single trace
    const sql = `
      SELECT trace_id, span_id, parent_span_id, name, service,
             start_time, end_time, duration_ms, status, attributes
      FROM traces
      WHERE project_id = '${projectId.replace(/'/g, "")}'
        AND trace_id = '${traceId.replace(/'/g, "")}'
      ORDER BY start_time ASC
    `;
    return NextResponse.json(await query(sql));
  }

  // List recent root spans (no parent)
  const sql = `
    SELECT trace_id, span_id, name, service,
           start_time, duration_ms, status
    FROM traces
    WHERE project_id = '${projectId.replace(/'/g, "")}'
      AND parent_span_id = ''
      AND start_time >= now() - INTERVAL ${hours} HOUR
    ORDER BY start_time DESC
    LIMIT ${limit}
  `;
  return NextResponse.json(await query(sql));
}
