import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import authPlugin from "./plugins/auth";
import logsRoute from "./routes/logs";
import metricsRoute from "./routes/metrics";
import tracesRoute from "./routes/traces";

const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
});

async function start() {
  await fastify.register(helmet);
  await fastify.register(cors, { origin: process.env.DASHBOARD_URL ?? "*" });
  await fastify.register(authPlugin);

  await fastify.register(logsRoute);
  await fastify.register(metricsRoute);
  await fastify.register(tracesRoute);

  fastify.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  const port = Number(process.env.INGESTION_PORT ?? 4318);
  await fastify.listen({ port, host: "0.0.0.0" });
  console.log(`ObservaBox Ingestion API listening on port ${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
