import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { insertRows, toChTs } from "../db/clickhouse";

const LogSchema = z.object({
  timestamp: z.string(),
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string(),
  service: z.string(),
  trace_id: z.string().optional(),
  span_id: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

const BodySchema = z.object({
  logs: z.array(LogSchema).min(1).max(1000),
});

const logsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/ingest/logs", async (request, reply) => {
    const projectId = request.headers["x-project-id"] as string;
    if (!projectId) return reply.code(400).send({ error: "x-project-id header required" });

    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const rows = parsed.data.logs.map((log) => ({
      project_id: projectId,
      timestamp: toChTs(log.timestamp),
      level: log.level,
      message: log.message,
      service: log.service,
      trace_id: log.trace_id ?? "",
      span_id: log.span_id ?? "",
      meta: JSON.stringify(log.meta ?? {}),
    }));

    await insertRows("logs", rows);
    return reply.code(202).send({ accepted: rows.length });
  });
};

export default logsRoute;
