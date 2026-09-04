-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Hotspots table
CREATE TABLE IF NOT EXISTS hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326),
    frp DOUBLE PRECISION,
    confidence VARCHAR(50),
    bright_ti4 DOUBLE PRECISION,
    daynight VARCHAR(10),
    satellite VARCHAR(50),
    acq_date DATE,
    acq_time TIME,
    instrument VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS hotspots_geom_idx ON hotspots USING GIST (geom);

-- Classifications table
CREATE TYPE classification_enum AS ENUM (
    'INDUSTRIAL_FIRE',
    'INDUSTRIAL_FLARE',
    'VEGETATION_FIRE',
    'AGRICULTURAL_BURN',
    'UNKNOWN'
);

CREATE TABLE IF NOT EXISTS classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID REFERENCES hotspots(id) ON DELETE CASCADE,
    classification classification_enum NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    explanation TEXT,
    evidence JSONB DEFAULT '[]'::jsonb,
    source_data JSONB DEFAULT '{}'::jsonb,
    osm_context JSONB DEFAULT '{}'::jsonb,
    classified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    classified_by VARCHAR(100) DEFAULT 'gemini-2.0-flash'
);

CREATE INDEX IF NOT EXISTS classifications_hotspot_id_idx ON classifications(hotspot_id);

-- Industrial Zones table
CREATE TABLE IF NOT EXISTS industrial_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    type VARCHAR(100),
    geom geometry,
    osm_id BIGINT,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS industrial_zones_geom_idx ON industrial_zones USING GIST (geom);

-- RLS Policies
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE industrial_zones ENABLE ROW LEVEL SECURITY;

-- Allow all users to read
CREATE POLICY "Allow read access to all users" ON hotspots FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON classifications FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON industrial_zones FOR SELECT USING (true);

-- Allow service_role (backend) to insert/update
CREATE POLICY "Allow service_role insert on hotspots" ON hotspots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service_role update on hotspots" ON hotspots FOR UPDATE USING (true);
CREATE POLICY "Allow service_role insert on classifications" ON classifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service_role update on classifications" ON classifications FOR UPDATE USING (true);
CREATE POLICY "Allow service_role insert on industrial_zones" ON industrial_zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service_role update on industrial_zones" ON industrial_zones FOR UPDATE USING (true);

