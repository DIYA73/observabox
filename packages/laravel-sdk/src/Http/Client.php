<?php

namespace ObservaBox\Http;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\RequestException;

class Client
{
    private GuzzleClient $http;
    private string $projectId;
    private bool $enabled;

    private array $logBuffer    = [];
    private array $metricBuffer = [];
    private array $spanBuffer   = [];

    public function __construct(
        string $ingestionUrl,
        private string $apiKey,
        string $projectId,
        bool $enabled = true
    ) {
        $this->projectId = $projectId;
        $this->enabled   = $enabled;
        $this->http = new GuzzleClient([
            'base_uri' => rtrim($ingestionUrl, '/') . '/',
            'timeout'  => 5,
            'headers'  => [
                'x-api-key'    => $apiKey,
                'x-project-id' => $projectId,
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function pushLog(array $entry): void
    {
        if (!$this->enabled) return;
        $this->logBuffer[] = $entry;
        if (count($this->logBuffer) >= 100) $this->flush();
    }

    public function pushMetric(array $entry): void
    {
        if (!$this->enabled) return;
        $this->metricBuffer[] = $entry;
        if (count($this->metricBuffer) >= 100) $this->flush();
    }

    public function pushSpan(array $entry): void
    {
        if (!$this->enabled) return;
        $this->spanBuffer[] = $entry;
        if (count($this->spanBuffer) >= 100) $this->flush();
    }

    public function flush(): void
    {
        $logs    = $this->logBuffer;
        $metrics = $this->metricBuffer;
        $spans   = $this->spanBuffer;

        $this->logBuffer = $this->metricBuffer = $this->spanBuffer = [];

        try {
            if (!empty($logs))    $this->post('ingest/logs',    ['logs'    => $logs]);
            if (!empty($metrics)) $this->post('ingest/metrics', ['metrics' => $metrics]);
            if (!empty($spans))   $this->post('ingest/traces',  ['spans'   => $spans]);
        } catch (RequestException) {
            // Observability must never crash the host app
        }
    }

    private function post(string $path, array $body): void
    {
        $this->http->post($path, ['json' => $body]);
    }
}
