CREATE TABLE IF NOT EXISTS industrial_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_m INTEGER DEFAULT 5000,
    source TEXT DEFAULT 'JSON_IMPORT',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE industrial_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on industrial_facilities" 
    ON industrial_facilities FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role full access on industrial_facilities"
    ON industrial_facilities FOR ALL 
    USING (true) WITH CHECK (true);

