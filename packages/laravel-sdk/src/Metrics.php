<?php

namespace ObservaBox;

use ObservaBox\Http\Client;

class Metrics
{
    public function __construct(private Client $client) {}

    private function now(): string
    {
        return (new \DateTime())->format(\DateTime::RFC3339_EXTENDED);
    }

    public function counter(string $name, float $value = 1, array $tags = []): void
    {
        $this->client->pushMetric(['timestamp' => $this->now(), 'name' => $name, 'value' => $value, 'type' => 'counter', 'tags' => $tags]);
    }

    public function gauge(string $name, float $value, string $unit = '', array $tags = []): void
    {
        $this->client->pushMetric(['timestamp' => $this->now(), 'name' => $name, 'value' => $value, 'type' => 'gauge', 'unit' => $unit, 'tags' => $tags]);
    }

    public function histogram(string $name, float $value, string $unit = '', array $tags = []): void
    {
        $this->client->pushMetric(['timestamp' => $this->now(), 'name' => $name, 'value' => $value, 'type' => 'histogram', 'unit' => $unit, 'tags' => $tags]);
    }

    /** Time a callable and record it as a histogram in ms */
    public function time(string $name, callable $fn, array $tags = []): mixed
    {
        $start = hrtime(true);
        try {
            return $fn();
        } finally {
            $this->histogram($name, (hrtime(true) - $start) / 1e6, 'ms', $tags);
        }
    }
}
