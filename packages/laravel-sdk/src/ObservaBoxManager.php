<?php

namespace ObservaBox;

use ObservaBox\Http\Client;

class ObservaBoxManager
{
    public readonly Client  $client;
    public readonly Logger  $logger;
    public readonly Metrics $metrics;
    public readonly Tracer  $tracer;

    public function __construct(array $config)
    {
        $this->client  = new Client(
            $config['ingestion_url'],
            $config['api_key'],
            $config['project_id'],
            $config['enabled'] ?? true
        );
        $service       = $config['service'] ?? 'laravel';
        $this->logger  = new Logger($this->client, $service);
        $this->metrics = new Metrics($this->client);
        $this->tracer  = new Tracer($this->client, $service);
    }

    public function flush(): void
    {
        $this->client->flush();
    }
}
