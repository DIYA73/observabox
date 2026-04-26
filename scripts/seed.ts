/**
 * Seed script — sends demo logs, metrics, and traces to the ingestion API.
 * Run: npx tsx scripts/seed.ts
 */
import axios from "axios";

const API = "http://localhost:4318";
const PROJECT_ID = process.env.PROJECT_ID ?? "demo";
const HEADERS = {
  "x-api-key": "change_me_in_production",
  "x-project-id": PROJECT_ID,
  "Content-Type": "application/json",
};

const services = ["api-gateway", "auth-service", "billing-service"];
const levels = ["debug", "info", "info", "info", "warn", "error"] as const;

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function iso(offsetMs = 0) { return new Date(Date.now() - offsetMs).toISOString(); }

async function seedLogs() {
  const logs = Array.from({ length: 50 }, (_, i) => ({
    timestamp: iso(i * 30_000),
    level: pick(levels),
    message: pick([
      "Request processed successfully",
      "User login attempt",
      "Database query took too long",
      "Failed to connect to upstream",
      "Payment webhook received",
      "Cache miss — fetching from DB",
      "Rate limit exceeded for IP",
      "JWT validation failed",
    ]),
    service: pick(services),
    meta: { latency_ms: rand(5, 500).toFixed(0), user_id: `u_${Math.floor(rand(1, 100))}` },
  }));
  await axios.post(`${API}/ingest/logs`, { logs }, { headers: HEADERS });
  console.log("✓ Seeded logs");
}

async function seedMetrics() {
  const metrics = Array.from({ length: 60 }, (_, i) => [
    { timestamp: iso(i * 60_000), name: "http.requests",   value: Math.floor(rand(10, 200)), type: "counter" },
    { timestamp: iso(i * 60_000), name: "http.latency_ms", value: rand(20, 800),              type: "histogram", unit: "ms" },
    { timestamp: iso(i * 60_000), name: "memory.rss_mb",   value: rand(200, 400),             type: "gauge",     unit: "MB" },
  ]).flat();
  await axios.post(`${API}/ingest/metrics`, { metrics }, { headers: HEADERS });
  console.log("✓ Seeded metrics");
}

async function seedTraces() {
  const spans = Array.from({ length: 20 }, (_, i) => {
    const traceId = `trace${i.toString().padStart(32, "0")}`;
    const startMs = Date.now() - i * 120_000;
    const dur = rand(10, 900);
    return [
      {
        trace_id: traceId, span_id: `root${i}`, parent_span_id: "",
        name: "POST /api/orders", service: "api-gateway",
        start_time: new Date(startMs).toISOString(),
        end_time:   new Date(startMs + dur).toISOString(),
        duration_ms: dur, status: dur > 700 ? "error" : "ok",
      },
      {
        trace_id: traceId, span_id: `db${i}`, parent_span_id: `root${i}`,
        name: "db.query", service: "billing-service",
        start_time: new Date(startMs + 5).toISOString(),
        end_time:   new Date(startMs + dur - 10).toISOString(),
        duration_ms: dur - 15, status: "ok",
      },
    ];
  }).flat();
  await axios.post(`${API}/ingest/traces`, { spans }, { headers: HEADERS });
  console.log("✓ Seeded traces");
}

(async () => {
  await Promise.all([seedLogs(), seedMetrics(), seedTraces()]);
  console.log("Seed complete.");
})();
