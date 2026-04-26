import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", async (request, reply) => {
    // Health check bypasses auth
    if (request.url === "/health") return;

    const apiKey = request.headers["x-api-key"];
    const expected = process.env.INGESTION_API_KEY ?? "change_me_in_production";

    if (!apiKey || apiKey !== expected) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

export default fp(authPlugin);
