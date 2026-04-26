# ObservaBox

A self-hosted observability platform for indie SaaS founders. Collect logs, metrics, and traces from any Node.js or Laravel app via a tiny SDK, store them in ClickHouse, and visualise everything in a real-time Next.js dashboard — with AI-powered incident summaries.

![ObservaBox Dashboard](https://raw.githubusercontent.com/yourusername/observabox/main/docs/dashboard.png)

## Features

- **Logs** — structured log ingestion with level filtering and full-text search
- **Metrics** — time-series counters, gauges, and histograms with live charts
- **Traces** — distributed tracing with span waterfall view
- **AI Incident Analysis** — GPT-4o-mini summarises errors in plain English
- **Alerts** — rule-based alerting (error rate / metric threshold) with webhook notifications
- **Multi-project** — manage multiple apps from one dashboard
- **Auth** — email/password login with JWT sessions
- **Self-hosted** — your data never leaves your server

## Stack

| Layer | Technology |
|---|---|
| Storage | ClickHouse (column-oriented, 30-day TTL) |
| Ingestion API | Fastify + Zod (Node.js) |
| Dashboard | Next.js 14 App Router + Tailwind CSS + Recharts |
| Auth & Projects | SQLite via better-sqlite3 + jose JWT |
| AI | OpenAI GPT-4o-mini |
| SDK (Node.js) | TypeScript, auto-batching, zero crash guarantee |
| SDK (Laravel) | PHP 8.1+, Guzzle, Laravel Service Provider + Facade |
| Deployment | Docker Compose + Caddy (automatic HTTPS) |

## Quick Start

### Prerequisites
- Node.js 20+, pnpm, Docker

### 1. Install dependencies
```bash
git clone https://github.com/yourusername/observabox
cd observabox
pnpm install
```

### 2. Start ClickHouse
```bash
docker-compose up -d
```

### 3. Start the ingestion API
```bash
cd apps/ingestion
pnpm dev
# Listening on http://localhost:4318
```

### 4. Start the dashboard
```bash
cd apps/dashboard
pnpm dev
# Open http://localhost:3001
```

### 5. Seed demo data
```bash
npx tsx scripts/seed.ts
```

Sign up at `http://localhost:3001/signup` and explore the dashboard.

## SDK Usage

### Node.js
```bash
pnpm add @observabox/sdk
```

```ts
import { createObservaBox } from "@observabox/sdk";

const obs = createObservaBox({
  ingestionUrl: "https://ingest.yourdomain.com",
  apiKey: "your_api_key",
  projectId: "your_project_id",
  service: "api",
});

obs.logger.info("User signed up", { userId: "u_123" });
obs.metrics.counter("signups");
obs.metrics.histogram("response_time_ms", 142);

const result = await obs.tracer.trace("checkout", async (span) => {
  return await processOrder();
});
```

### Laravel
```bash
composer require observabox/laravel-sdk
```

```php
# .env
OBSERVABOX_URL=https://ingest.yourdomain.com
OBSERVABOX_API_KEY=your_api_key
OBSERVABOX_PROJECT_ID=your_project_id
OBSERVABOX_SERVICE=laravel
```

```php
use ObservaBox\Facades\ObservaBox;

ObservaBox::logger()->info('Order placed', ['order_id' => $id]);
ObservaBox::metrics()->counter('orders.created');
ObservaBox::tracer()->trace('db.query', fn($span) => DB::select(...));
```

## Deploy to a VPS

```bash
# 1. Copy and fill in your values
cp .env.prod.example .env.prod

# 2. Add DNS A records for your domain pointing to your VPS
#    observabox.yourdomain.com      → VPS IP
#    ingest.observabox.yourdomain.com → VPS IP

# 3. Deploy (one command)
./deploy.sh root@your-vps-ip
```

Caddy handles SSL certificates automatically. Dashboard available at `https://observabox.yourdomain.com`.

## Project Structure

```
observabox/
├── apps/
│   ├── ingestion/          # Fastify ingestion API
│   └── dashboard/          # Next.js dashboard
├── packages/
│   ├── sdk/                # Node.js SDK
│   └── laravel-sdk/        # Laravel/PHP SDK
├── infra/
│   ├── clickhouse/         # DB schema & init SQL
│   └── caddy/              # Reverse proxy config
├── scripts/
│   └── seed.ts             # Demo data seeder
├── docker-compose.yml      # Local development
├── docker-compose.prod.yml # Production
└── deploy.sh               # One-command VPS deploy
```

## Environment Variables

| Variable | Description |
|---|---|
| `CLICKHOUSE_HOST` | ClickHouse HTTP endpoint |
| `CLICKHOUSE_PASSWORD` | ClickHouse password |
| `JWT_SECRET` | 32+ char secret for JWT signing |
| `INGESTION_API_KEY` | API key SDK clients must send |
| `OPENAI_API_KEY` | For AI incident analysis (optional) |
| `DOMAIN` | Your domain for production deploy |

## License

MIT
