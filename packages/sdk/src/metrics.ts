import { ObservaBoxClient } from "./client";

export class Metrics {
  constructor(private client: ObservaBoxClient) {}

  private now() { return new Date().toISOString(); }

  counter(name: string, value = 1, tags?: Record<string, string>) {
    this.client.pushMetric({ timestamp: this.now(), name, value, type: "counter", tags });
  }

  gauge(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    this.client.pushMetric({ timestamp: this.now(), name, value, type: "gauge", unit, tags });
  }

  histogram(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    this.client.pushMetric({ timestamp: this.now(), name, value, type: "histogram", unit, tags });
  }

  /** Time an async function and record it as a histogram in ms */
  async time<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.histogram(name, Date.now() - start, "ms", tags);
    }
  }
}
