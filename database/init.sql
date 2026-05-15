-- Calculator Database Initialization
-- Runs on first container startup

CREATE TABLE IF NOT EXISTS calculations (
    id        SERIAL PRIMARY KEY,
    expression VARCHAR(255) NOT NULL,
    result     NUMERIC      NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW()
);

-- Index for faster ordering
CREATE INDEX IF NOT EXISTS idx_calculations_created_at
    ON calculations (created_at DESC);

-- Seed some sample data
INSERT INTO calculations (expression, result) VALUES
    ('10 + 5',    15),
    ('100 / 4',   25),
    ('7 * 8',     56),
    ('(3 + 4) * 2', 14)
ON CONFLICT DO NOTHING;
