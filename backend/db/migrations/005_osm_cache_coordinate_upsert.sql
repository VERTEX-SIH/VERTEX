ALTER TABLE public.osm_context_cache
  ALTER COLUMN hotspot_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  osm_context_cache_lat_lon_unique
ON public.osm_context_cache (latitude, longitude);

DELETE FROM public.osm_context_cache
WHERE osm_source = 'TEST';