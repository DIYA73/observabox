import axios, { AxiosInstance } from "axios";

export interface ObservaBoxConfig {
  ingestionUrl: string;
  apiKey: string;
  projectId: string;
  service?: string;
  flushIntervalMs?: number;
  batchSize?: number;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  trace_id?: string;
  span_id?: string;
  meta?: Record<string, unknown>;
}

export interface MetricEntry {
  timestamp: string;
  name: string;
  value: number;
  type: "counter" | "gauge" | "histogram";
  unit?: string;
  tags?: Record<string, string>;
}

export interface SpanEntry {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  service: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  status: "ok" | "error" | "unset";
  attributes?: Record<string, unknown>;
}

export class ObservaBoxClient {
  private http: AxiosInstance;
  private config: Required<ObservaBoxConfig>;
  private logBuffer: LogEntry[] = [];
  private metricBuffer: MetricEntry[] = [];
  private spanBuffer: SpanEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: ObservaBoxConfig) {
    this.config = {
      service: "default",
      flushIntervalMs: 3000,
      batchSize: 100,
      ...config,
    };

    this.http = axios.create({
      baseURL: this.config.ingestionUrl,
      headers: {
        "x-api-key": this.config.apiKey,
        "x-project-id": this.config.projectId,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    this.startFlushTimer();
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.config.flushIntervalMs);
    // Don't block process exit
    if (this.flushTimer.unref) this.flushTimer.unref();
  }

  pushLog(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length >= this.config.batchSize) this.flush();
  }

  pushMetric(entry: MetricEntry) {
    this.metricBuffer.push(entry);
    if (this.metricBuffer.length >= this.config.batchSize) this.flush();
  }

  pushSpan(entry: SpanEntry) {
    this.spanBuffer.push(entry);
    if (this.spanBuffer.length >= this.config.batchSize) this.flush();
  }

  async flush(): Promise<void> {
    const logs = this.logBuffer.splice(0);
    const metrics = this.metricBuffer.splice(0);
    const spans = this.spanBuffer.splice(0);

    const sends: Promise<void>[] = [];

    if (logs.length > 0) {
      sends.push(
        this.http.post("/ingest/logs", { logs }).then(() => {}).catch(this.handleError)
      );
    }
    if (metrics.length > 0) {
      sends.push(
        this.http.post("/ingest/metrics", { metrics }).then(() => {}).catch(this.handleError)
      );
    }
    if (spans.length > 0) {
      sends.push(
        this.http.post("/ingest/traces", { spans }).then(() => {}).catch(this.handleError)
      );
    }

    await Promise.all(sends);
  }

  private handleError = (err: unknown) => {
    // Silently drop on network error — observability must never crash the host app
    if (process.env.OBSERVABOX_DEBUG) {
      console.error("[ObservaBox] flush error:", err);
    }
  };

  async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }
}
