-- VERTEX schema alignment (idempotent)
-- Apply in Supabase SQL Editor after prior migrations.

ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS scan DOUBLE PRECISION;
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS track DOUBLE PRECISION;
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS bright_t31 DOUBLE PRECISION;
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classification_enum') THEN
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'PERSISTENT_INDUSTRIAL_SOURCE';
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'GAS_FLARE';
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'WILDFIRE_FOREST_FIRE';
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'MINING_THERMAL_ACTIVITY';
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'OTHER_THERMAL_ANOMALY';
    ALTER TYPE classification_enum ADD VALUE IF NOT EXISTS 'UNKNOWN_UNCERTAIN';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS osm_context_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    hotspot_id TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    nearby_facilities JSONB DEFAULT '[]'::jsonb,
    nearest_facility_distance DOUBLE PRECISION,
    nearest_facility_type TEXT,
    facility_count_in_radius INTEGER DEFAULT 0,
    land_use_context JSONB DEFAULT '[]'::jsonb,
    osm_source TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS osm_context_cache_coord_idx ON osm_context_cache(latitude, longitude);
