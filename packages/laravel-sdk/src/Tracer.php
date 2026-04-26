<?php

namespace ObservaBox;

use ObservaBox\Http\Client;

class Span
{
    public readonly string $traceId;
    public readonly string $spanId;
    private \DateTime $startTime;

    public function __construct(
        private Client $client,
        private string $name,
        private string $service,
        ?string $traceId = null,
        public readonly ?string $parentSpanId = null
    ) {
        $this->traceId   = $traceId ?? bin2hex(random_bytes(16));
        $this->spanId    = bin2hex(random_bytes(8));
        $this->startTime = new \DateTime();
    }

    public function end(string $status = 'ok', array $attributes = []): void
    {
        $endTime = new \DateTime();
        $durationMs = ($endTime->getTimestamp() - $this->startTime->getTimestamp()) * 1000
            + (int)(($endTime->format('u') - $this->startTime->format('u')) / 1000);

        $this->client->pushSpan([
            'trace_id'       => $this->traceId,
            'span_id'        => $this->spanId,
            'parent_span_id' => $this->parentSpanId ?? '',
            'name'           => $this->name,
            'service'        => $this->service,
            'start_time'     => $this->startTime->format(\DateTime::RFC3339_EXTENDED),
            'end_time'       => $endTime->format(\DateTime::RFC3339_EXTENDED),
            'duration_ms'    => max(0, $durationMs),
            'status'         => $status,
            'attributes'     => $attributes,
        ]);
    }
}

class Tracer
{
    public function __construct(
        private Client $client,
        private string $service
    ) {}

    public function startSpan(string $name, ?string $traceId = null, ?string $parentSpanId = null): Span
    {
        return new Span($this->client, $name, $this->service, $traceId, $parentSpanId);
    }

    /** Wrap a callable in a span, auto-ending on return or exception */
    public function trace(string $name, callable $fn, ?string $traceId = null, ?string $parentSpanId = null): mixed
    {
        $span = $this->startSpan($name, $traceId, $parentSpanId);
        try {
            $result = $fn($span);
            $span->end('ok');
            return $result;
        } catch (\Throwable $e) {
            $span->end('error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
