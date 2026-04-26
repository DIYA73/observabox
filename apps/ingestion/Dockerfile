FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@9

WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/ingestion/package.json ./apps/ingestion/
# Stub out the other workspace packages so pnpm resolves the graph
RUN mkdir -p packages/sdk && echo '{"name":"@observabox/sdk","version":"0.1.0"}' > packages/sdk/package.json

RUN pnpm install --filter @observabox/ingestion
COPY apps/ingestion ./apps/ingestion
RUN pnpm --filter @observabox/ingestion build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY --from=builder /app/node_modules                     ./node_modules
COPY --from=builder /app/apps/ingestion/node_modules      ./apps/ingestion/node_modules
COPY --from=builder /app/apps/ingestion/dist              ./apps/ingestion/dist
COPY --from=builder /app/apps/ingestion/package.json      ./apps/ingestion/package.json

WORKDIR /app/apps/ingestion
EXPOSE 4318
CMD ["node", "dist/index.js"]
