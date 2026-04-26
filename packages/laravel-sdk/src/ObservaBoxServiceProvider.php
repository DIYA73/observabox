<?php

namespace ObservaBox;

use Illuminate\Support\ServiceProvider;

class ObservaBoxServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/observabox.php', 'observabox');

        $this->app->singleton(ObservaBoxManager::class, function ($app) {
            return new ObservaBoxManager($app['config']['observabox']);
        });

        // Convenient aliases
        $this->app->alias(ObservaBoxManager::class, 'observabox');
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/../config/observabox.php' => config_path('observabox.php'),
        ], 'observabox-config');

        // Flush buffers when the request/job lifecycle ends
        if ($this->app['config']['observabox.flush_on_terminate'] ?? true) {
            $this->app->terminating(function () {
                $this->app->make(ObservaBoxManager::class)->flush();
            });
        }
    }
}
