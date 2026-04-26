-- Logs table
CREATE TABLE IF NOT EXISTS observabox.logs (
    id          UUID DEFAULT generateUUIDv4(),
    project_id  String,
    timestamp   DateTime64(3) DEFAULT now64(),
    level       LowCardinality(String),  -- debug | info | warn | error | fatal
    message     String,
    service     String,
    trace_id    String,
    span_id     String,
    meta        String  -- JSON blob for arbitrary key/values
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (project_id, timestamp, level)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;

-- Metrics table
CREATE TABLE IF NOT EXISTS observabox.metrics (
    id          UUID DEFAULT generateUUIDv4(),
    project_id  String,
    timestamp   DateTime64(3) DEFAULT now64(),
    name        String,
    value       Float64,
    type        LowCardinality(String),  -- counter | gauge | histogram
    unit        String,
    tags        String  -- JSON blob
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (project_id, name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;

-- Traces table
CREATE TABLE IF NOT EXISTS observabox.traces (
    id           UUID DEFAULT generateUUIDv4(),
    project_id   String,
    trace_id     String,
    span_id      String,
    parent_span_id String,
    name         String,
    service      String,
    start_time   DateTime64(3),
    end_time     DateTime64(3),
    duration_ms  Float64,
    status       LowCardinality(String),  -- ok | error | unset
    attributes   String  -- JSON blob
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(start_time)
ORDER BY (project_id, trace_id, start_time)
TTL toDateTime(start_time) + INTERVAL 30 DAY;
