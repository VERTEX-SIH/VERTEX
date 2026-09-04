-- VERTEX Platform Supabase Schema
-- Run this in your Supabase SQL Editor

-- 1. Create Hotspots Table
CREATE TABLE IF NOT EXISTS hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    brightness DOUBLE PRECISION,
    scan DOUBLE PRECISION,
    track DOUBLE PRECISION,
    version TEXT,
    bright_t31 DOUBLE PRECISION,
    raw_data JSONB DEFAULT '{}'::jsonb,
    frp DOUBLE PRECISION,
    confidence TEXT,
    daynight TEXT,
    satellite TEXT,
    instrument TEXT,
    acq_date DATE,
    acq_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(latitude, longitude, acq_date, acq_time, satellite)
);

-- 2. Create Classifications Table
CREATE TABLE IF NOT EXISTS classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID REFERENCES hotspots(id) ON DELETE CASCADE,
    classification TEXT NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    explanation TEXT,
    evidence JSONB DEFAULT '[]'::jsonb,
    risk_score DOUBLE PRECISION DEFAULT 0,
    risk_level TEXT DEFAULT 'LOW',
    source_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create OSM Context Table (Optional, but good for normal form)
CREATE TABLE IF NOT EXISTS osm_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID REFERENCES hotspots(id) ON DELETE CASCADE,
    nearby_facilities JSONB DEFAULT '[]'::jsonb,
    nearest_facility_distance DOUBLE PRECISION,
    nearest_facility_type TEXT,
    facility_count_in_radius INTEGER DEFAULT 0,
    land_use_context JSONB DEFAULT '[]'::jsonb,
    osm_source TEXT DEFAULT 'PENDING'
);

-- 4. Create RLS Policies
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE osm_contexts ENABLE ROW LEVEL SECURITY;

-- Allow read access to anonymous users (if needed for public demo)
CREATE POLICY "Allow public read-only access to hotspots" ON hotspots FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to classifications" ON classifications FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to osm_contexts" ON osm_contexts FOR SELECT USING (true);

-- Allow full access to authenticated service role
CREATE POLICY "Allow service role full access hotspots" ON hotspots USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access classifications" ON classifications USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access osm_contexts" ON osm_contexts USING (auth.role() = 'service_role');

-- 5. Create Persistent Sources Table
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
