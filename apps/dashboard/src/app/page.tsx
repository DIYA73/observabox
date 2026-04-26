import StatCard from "@/components/ui/StatCard";
import { query } from "@/lib/clickhouse";
import { getProjectId } from "@/lib/projectId";
import AiSummary from "./AiSummary";

async function getOverviewStats(projectId: string) {
  const safe = projectId.replace(/'/g, "");
  const [logStats, traceStats] = await Promise.all([
    query<{ level: string; cnt: number }>(`
      SELECT level, count() AS cnt FROM logs
      WHERE project_id = '${safe}' AND timestamp >= now() - INTERVAL 24 HOUR
      GROUP BY level
    `),
    query<{ cnt: number; p95_ms: number }>(`
      SELECT count() AS cnt, quantile(0.95)(duration_ms) AS p95_ms FROM traces
      WHERE project_id = '${safe}' AND start_time >= now() - INTERVAL 24 HOUR
    `),
  ]);

  const byLevel = Object.fromEntries(logStats.map((r) => [r.level, r.cnt]));
  return {
    totalLogs: logStats.reduce((s, r) => s + Number(r.cnt), 0),
    errors: (Number(byLevel["error"] ?? 0)) + (Number(byLevel["fatal"] ?? 0)),
    p95: traceStats[0]?.p95_ms ?? 0,
    spans: traceStats[0]?.cnt ?? 0,
  };
}

export default async function OverviewPage() {
  const projectId = await getProjectId();
  const stats = await getOverviewStats(projectId).catch(() => ({ totalLogs: 0, errors: 0, p95: 0, spans: 0 }));

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Last 24 hours · {projectId}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Logs"  value={stats.totalLogs.toLocaleString()} color="blue"   />
        <StatCard label="Errors"      value={stats.errors.toLocaleString()}     color="red"    sub="error + fatal" />
        <StatCard label="Spans"       value={stats.spans.toLocaleString()}       color="green"  />
        <StatCard label="p95 Latency" value={`${Number(stats.p95).toFixed(0)}ms`} color="yellow" />
      </div>

      <AiSummary projectId={projectId} />
    </div>
  );
}
