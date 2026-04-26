import { createClient, ClickHouseClient } from "@clickhouse/client";

let client: ClickHouseClient | null = null;

export function getClickHouse(): ClickHouseClient {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_HOST ?? "http://localhost:8123",
      database: process.env.CLICKHOUSE_DB ?? "observabox",
      username: process.env.CLICKHOUSE_USER ?? "observabox",
      password: process.env.CLICKHOUSE_PASSWORD ?? "observabox_secret",
    });
  }
  return client;
}

/** Convert ISO 8601 timestamp to ClickHouse DateTime64 format (space separator, no Z) */
export function toChTs(iso: string): string {
  return iso.replace("T", " ").replace("Z", "").replace(/\+\d{2}:\d{2}$/, "");
}

export async function insertRows(table: string, rows: Record<string, unknown>[]) {
  await getClickHouse().insert({
    table,
    values: rows,
    format: "JSONEachRow",
    clickhouse_settings: { date_time_input_format: "best_effort" },
  });
}
