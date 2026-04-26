<?php

return [
    'ingestion_url' => env('OBSERVABOX_URL', 'http://localhost:4318'),
    'api_key'       => env('OBSERVABOX_API_KEY', ''),
    'project_id'    => env('OBSERVABOX_PROJECT_ID', 'default'),
    'service'       => env('OBSERVABOX_SERVICE', 'laravel'),
    'flush_on_terminate' => true,
    'enabled'       => env('OBSERVABOX_ENABLED', true),
];
