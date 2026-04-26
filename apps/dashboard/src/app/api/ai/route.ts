import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { query } from "@/lib/clickhouse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { projectId = "demo", hours = 1 } = await req.json();

  // Gather recent errors and high-rate metrics for context
  const [errorLogs, metricSpikes] = await Promise.all([
    query<{ timestamp: string; message: string; service: string; meta: string }>(`
      SELECT timestamp, message, service, meta
      FROM logs
      WHERE project_id = '${projectId}'
        AND level IN ('error', 'fatal')
        AND timestamp >= now() - INTERVAL ${hours} HOUR
      ORDER BY timestamp DESC
      LIMIT 30
    `),
    query<{ name: string; max_value: number; avg_value: number }>(`
      SELECT name, max(value) AS max_value, avg(value) AS avg_value
      FROM metrics
      WHERE project_id = '${projectId}'
        AND timestamp >= now() - INTERVAL ${hours} HOUR
      GROUP BY name
      ORDER BY max_value DESC
      LIMIT 10
    `),
  ]);

  if (errorLogs.length === 0) {
    return NextResponse.json({ summary: "No errors detected in the selected window. System looks healthy." });
  }

  const context = `
## Recent Errors (last ${hours}h)
${errorLogs.map((e) => `- [${e.timestamp}] ${e.service}: ${e.message}`).join("\n")}

## Top Metrics
${metricSpikes.map((m) => `- ${m.name}: avg=${m.avg_value.toFixed(2)}, max=${m.max_value.toFixed(2)}`).join("\n")}
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an SRE assistant. Given raw observability data, write a concise incident summary (3-5 sentences) for a non-technical founder. Identify the likely root cause, affected services, and recommended next steps. Be direct and actionable.",
      },
      { role: "user", content: context },
    ],
    max_tokens: 300,
  });

  return NextResponse.json({ summary: completion.choices[0].message.content });
}
