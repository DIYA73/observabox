export { ObservaBoxClient, type ObservaBoxConfig } from "./client";
export { Logger } from "./logger";
export { Metrics } from "./metrics";
export { Tracer, Span } from "./tracer";

import { ObservaBoxClient, ObservaBoxConfig } from "./client";
import { Logger } from "./logger";
import { Metrics } from "./metrics";
import { Tracer } from "./tracer";

export interface ObservaBox {
  client: ObservaBoxClient;
  logger: Logger;
  metrics: Metrics;
  tracer: Tracer;
}

/** Create a fully wired ObservaBox instance */
export function createObservaBox(config: ObservaBoxConfig): ObservaBox {
  const client = new ObservaBoxClient(config);
  const service = config.service ?? "default";
  return {
    client,
    logger: new Logger(client, service),
    metrics: new Metrics(client),
    tracer: new Tracer(client, service),
  };
}
