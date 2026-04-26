import { createClient } from "@clickhouse/client";

export const ch = createClient({
  url: process.env.CLICKHOUSE_HOST ?? "http://localhost:8123",
  database: process.env.CLICKHOUSE_DB ?? "observabox",
  username: process.env.CLICKHOUSE_USER ?? "observabox",
  password: process.env.CLICKHOUSE_PASSWORD ?? "observabox_secret",
});

export async function query<T>(sql: string): Promise<T[]> {
  const result = await ch.query({ query: sql, format: "JSONEachRow" });
  return result.json<T>();
}
