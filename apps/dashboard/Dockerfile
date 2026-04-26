FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
RUN npm install -g pnpm@9

WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
RUN mkdir -p packages/sdk && echo '{"name":"@observabox/sdk","version":"0.1.0"}' > packages/sdk/package.json

RUN pnpm install --filter @observabox/dashboard
COPY apps/dashboard ./apps/dashboard

# Needs env vars present at build time for Next.js static analysis
ARG CLICKHOUSE_HOST=http://clickhouse:8123
ARG CLICKHOUSE_DB=observabox
ARG CLICKHOUSE_USER=observabox
ARG CLICKHOUSE_PASSWORD=observabox_secret

WORKDIR /app/apps/dashboard
RUN pnpm build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Standalone output bundles everything needed
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static      ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public            ./apps/dashboard/public

# SQLite data volume
VOLUME ["/app/apps/dashboard/data"]

EXPOSE 3001
CMD ["node", "apps/dashboard/server.js"]
