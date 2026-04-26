import { NextRequest, NextResponse } from "next/server";
import { getDb, AlertRule } from "@/lib/db";
import { query } from "@/lib/clickhouse";
import { getSession } from "@/lib/auth";

interface AlertCondition {
  threshold: number;
  window_minutes: number;
  operator: ">=" | ">";
  metric?: string;   // for metric_threshold
}

async function checkLogErrorRate(projectId: string, cond: AlertCondition): Promise<number> {
  const rows = await query<{ error_count: number; total_count: number }>(`
    SELECT
      countIf(level IN ('error','fatal')) AS error_count,
      count() AS total_count
    FROM logs
    WHERE project_id = '${projectId}'
      AND timestamp >= now() - INTERVAL ${cond.window_minutes} MINUTE
  `);
  const r = rows[0];
  if (!r || r.total_count === 0) return 0;
  return (r.error_count / r.total_count) * 100;
}

async function checkMetricThreshold(projectId: string, cond: AlertCondition): Promise<number> {
  const rows = await query<{ avg_val: number }>(`
    SELECT avg(value) AS avg_val FROM metrics
    WHERE project_id = '${projectId}'
      AND name = '${cond.metric?.replace(/'/g, "") ?? ""}'
      AND timestamp >= now() - INTERVAL ${cond.window_minutes} MINUTE
  `);
  return rows[0]?.avg_val ?? 0;
}

async function sendWebhook(url: string, rule: AlertRule, value: number) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alert: rule.name,
      type: rule.type,
      value,
      project_id: rule.project_id,
      fired_at: new Date().toISOString(),
    }),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await req.json();
  const db = getDb();

  const rules = db
    .prepare("SELECT * FROM alert_rules WHERE project_id = ? AND enabled = 1")
    .all(projectId) as AlertRule[];

  const results: { rule: string; value: number; fired: boolean }[] = [];

  for (const rule of rules) {
    const cond: AlertCondition = JSON.parse(rule.condition_json);
    let value = 0;

    if (rule.type === "log_error_rate") {
      value = await checkLogErrorRate(projectId, cond);
    } else if (rule.type === "metric_threshold") {
      value = await checkMetricThreshold(projectId, cond);
    }

    const fired =
      cond.operator === ">=" ? value >= cond.threshold : value > cond.threshold;

    if (fired) {
      await sendWebhook(rule.webhook_url, rule, value).catch(() => {});
      db.prepare("UPDATE alert_rules SET last_fired_at = unixepoch() WHERE id = ?").run(rule.id);
    }

    results.push({ rule: rule.name, value, fired });
  }

  return NextResponse.json({ evaluated: results.length, results });
}
