import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { insertRows, toChTs } from "../db/clickhouse";

const SpanSchema = z.object({
  trace_id: z.string(),
  span_id: z.string(),
  parent_span_id: z.string().optional(),
  name: z.string(),
  service: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  duration_ms: z.number(),
  status: z.enum(["ok", "error", "unset"]),
  attributes: z.record(z.unknown()).optional(),
});

const BodySchema = z.object({
  spans: z.array(SpanSchema).min(1).max(1000),
});

const tracesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/ingest/traces", async (request, reply) => {
    const projectId = request.headers["x-project-id"] as string;
    if (!projectId) return reply.code(400).send({ error: "x-project-id header required" });

    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const rows = parsed.data.spans.map((s) => ({
      project_id: projectId,
      trace_id: s.trace_id,
      span_id: s.span_id,
      parent_span_id: s.parent_span_id ?? "",
      name: s.name,
      service: s.service,
      start_time: toChTs(s.start_time),
      end_time: toChTs(s.end_time),
      duration_ms: s.duration_ms,
      status: s.status,
      attributes: JSON.stringify(s.attributes ?? {}),
    }));

    await insertRows("traces", rows);
    return reply.code(202).send({ accepted: rows.length });
  });
};

export default tracesRoute;
