export const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];
export const DEFAULT_ZOOM = 5;
export const DEFAULT_PITCH = 60;
export const DEFAULT_BEARING = -20;
export const MAP_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};
export const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
export const INDIA_ZOOM = 4.8;
export const INDIA_MIN_ZOOM = 1.0;
export const INDIA_MAX_ZOOM = 18;

// India strict geographic bounding box: [West, South, East, North]
export const INDIA_BBOX: [number, number, number, number] = [68.0, 6.0, 97.5, 37.5];

// Map navigation viewport limits: [West, South, East, North]
export const INDIA_MAX_BOUNDS: [number, number, number, number] = [65.0, 5.0, 100.0, 38.5];

/**
 * Checks whether a given latitude and longitude falls within India's sovereign bounding box.
 */
export function isWithinIndia(latitude?: number | null, longitude?: number | null): boolean {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }
  return lat >= 6.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
}
