import { randomBytes } from "crypto";
import { ObservaBoxClient } from "./client";

function generateId(bytes = 16) {
  return randomBytes(bytes).toString("hex");
}

export class Span {
  readonly traceId: string;
  readonly spanId: string;
  private startTime: Date;

  constructor(
    private client: ObservaBoxClient,
    private name: string,
    private service: string,
    traceId?: string,
    readonly parentSpanId?: string
  ) {
    this.traceId = traceId ?? generateId(16);
    this.spanId = generateId(8);
    this.startTime = new Date();
  }

  end(status: "ok" | "error" | "unset" = "ok", attributes?: Record<string, unknown>) {
    const endTime = new Date();
    this.client.pushSpan({
      trace_id: this.traceId,
      span_id: this.spanId,
      parent_span_id: this.parentSpanId,
      name: this.name,
      service: this.service,
      start_time: this.startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_ms: endTime.getTime() - this.startTime.getTime(),
      status,
      attributes,
    });
  }
}

export class Tracer {
  constructor(
    private client: ObservaBoxClient,
    private service: string
  ) {}

  startSpan(name: string, traceId?: string, parentSpanId?: string): Span {
    return new Span(this.client, name, this.service, traceId, parentSpanId);
  }

  /** Wrap an async function in a span, auto-ending it on resolve/reject */
  async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    traceId?: string,
    parentSpanId?: string
  ): Promise<T> {
    const span = this.startSpan(name, traceId, parentSpanId);
    try {
      const result = await fn(span);
      span.end("ok");
      return result;
    } catch (err) {
      span.end("error", { error: String(err) });
      throw err;
    }
  }
}
