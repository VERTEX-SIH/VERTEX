-- Migration to add persistent_sources table

CREATE TABLE IF NOT EXISTS persistent_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centroid_lat DOUBLE PRECISION NOT NULL,
    centroid_lon DOUBLE PRECISION NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    observation_count INTEGER DEFAULT 1,
    active_days INTEGER DEFAULT 1,
    avg_frp DOUBLE PRECISION,
    max_frp DOUBLE PRECISION,
    avg_confidence DOUBLE PRECISION,
    persistence_duration DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE persistent_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to persistent_sources" ON persistent_sources FOR SELECT USING (true);
CREATE POLICY "Allow service role full access persistent_sources" ON persistent_sources USING (auth.role() = 'service_role');
