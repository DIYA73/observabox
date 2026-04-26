import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { insertRows, toChTs } from "../db/clickhouse";

const MetricSchema = z.object({
  timestamp: z.string(),
  name: z.string(),
  value: z.number(),
  type: z.enum(["counter", "gauge", "histogram"]),
  unit: z.string().optional(),
  tags: z.record(z.string()).optional(),
});

const BodySchema = z.object({
  metrics: z.array(MetricSchema).min(1).max(1000),
});

const metricsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/ingest/metrics", async (request, reply) => {
    const projectId = request.headers["x-project-id"] as string;
    if (!projectId) return reply.code(400).send({ error: "x-project-id header required" });

    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const rows = parsed.data.metrics.map((m) => ({
      project_id: projectId,
      timestamp: toChTs(m.timestamp),
      name: m.name,
      value: m.value,
      type: m.type,
      unit: m.unit ?? "",
      tags: JSON.stringify(m.tags ?? {}),
    }));

    await insertRows("metrics", rows);
    return reply.code(202).send({ accepted: rows.length });
  });
};

export default metricsRoute;
