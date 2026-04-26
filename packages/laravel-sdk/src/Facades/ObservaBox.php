<?php

namespace ObservaBox\Facades;

use Illuminate\Support\Facades\Facade;
use ObservaBox\ObservaBoxManager;

/**
 * @method static \ObservaBox\Logger  logger()
 * @method static \ObservaBox\Metrics metrics()
 * @method static \ObservaBox\Tracer  tracer()
 * @method static void flush()
 *
 * @see ObservaBoxManager
 */
class ObservaBox extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'observabox';
    }
}
