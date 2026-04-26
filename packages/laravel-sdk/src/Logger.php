<?php

namespace ObservaBox;

use ObservaBox\Http\Client;

class Logger
{
    public function __construct(
        private Client $client,
        private string $service,
        private array $defaultMeta = []
    ) {}

    private function log(string $level, string $message, array $meta = []): void
    {
        $this->client->pushLog([
            'timestamp' => (new \DateTime())->format(\DateTime::RFC3339_EXTENDED),
            'level'     => $level,
            'message'   => $message,
            'service'   => $this->service,
            'meta'      => array_merge($this->defaultMeta, $meta),
        ]);
    }

    public function debug(string $message, array $meta = []): void { $this->log('debug', $message, $meta); }
    public function info(string $message,  array $meta = []): void { $this->log('info',  $message, $meta); }
    public function warn(string $message,  array $meta = []): void { $this->log('warn',  $message, $meta); }
    public function error(string $message, array $meta = []): void { $this->log('error', $message, $meta); }
    public function fatal(string $message, array $meta = []): void { $this->log('fatal', $message, $meta); }

    public function withContext(array $meta): self
    {
        return new self($this->client, $this->service, array_merge($this->defaultMeta, $meta));
    }
}
