ALTER TABLE classifications ADD COLUMN IF NOT EXISTS osm_context JSONB DEFAULT '{}'::jsonb;
