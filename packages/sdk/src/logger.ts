import { ObservaBoxClient, LogLevel } from "./client";

export class Logger {
  constructor(
    private client: ObservaBoxClient,
    private service: string,
    private defaultMeta?: Record<string, unknown>
  ) {}

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    this.client.pushLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      meta: { ...this.defaultMeta, ...meta },
    });
  }

  debug(message: string, meta?: Record<string, unknown>) { this.log("debug", message, meta); }
  info(message: string, meta?: Record<string, unknown>)  { this.log("info",  message, meta); }
  warn(message: string, meta?: Record<string, unknown>)  { this.log("warn",  message, meta); }
  error(message: string, meta?: Record<string, unknown>) { this.log("error", message, meta); }
  fatal(message: string, meta?: Record<string, unknown>) { this.log("fatal", message, meta); }

  child(extraMeta: Record<string, unknown>): Logger {
    return new Logger(this.client, this.service, { ...this.defaultMeta, ...extraMeta });
  }
}
