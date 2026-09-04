'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Map, Source, Layer, MapRef, Popup, NavigationControl, ViewStateChangeEvent, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { ClassifiedHotspot, CLASSIFICATION_COLORS, ClassificationType } from '@/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import { useGlobalState } from '@/lib/GlobalStateContext';
import { FirePopup } from './FirePopup';

interface MapViewProps {
  hotspots: ClassifiedHotspot[];
  selectedHotspot?: ClassifiedHotspot | null;
  onSelectHotspot?: (hotspot: ClassifiedHotspot | null) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const { mapStyle, mapCenter: savedCenter, mapZoom: savedZoom, setMapCenter, setMapZoom } = useGlobalState();
  const visibleHotspots = hotspots;
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const hasAutoFitted = useRef(false);
  const isInitialMount = useRef(true);

  const effectiveCenter = savedCenter || center;
  const effectiveZoom = savedZoom || zoom;
  const [viewState, setViewState] = useState({ longitude: effectiveCenter[0], latitude: effectiveCenter[1], zoom: effectiveZoom });

  useEffect(() => {
    setMounted(true);
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = 'default';
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (!selectedHotspot || !mapRef.current) return;
    const longitude = Number(selectedHotspot.hotspot.longitude);
    const latitude = Number(selectedHotspot.hotspot.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15.8, duration: 1500 });
  }, [selectedHotspot, mounted]);

  const onMoveEnd = useCallback((event: ViewStateChangeEvent) => {
    const { longitude, latitude, zoom } = event.viewState;
    setViewState(event.viewState);
    if (!isInitialMount.current) {
      setMapCenter([longitude, latitude]);
      setMapZoom(zoom);
    }
  }, [setMapCenter, setMapZoom]);

  const onMove = useCallback((event: ViewStateChangeEvent) => setViewState(event.viewState), []);

  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: visibleHotspots.map((hotspot) => {
      const type = hotspot?.classification?.classification as ClassificationType;
      const isPending = !type || type === ClassificationType.UNCLASSIFIED;
      const color = isPending ? '#8a8a8a' : (CLASSIFICATION_COLORS[type] || CLASSIFICATION_COLORS[ClassificationType.UNKNOWN_UNCERTAIN]);
      const riskLevel = String(hotspot?.classification?.risk_level ?? '').toUpperCase();
      const riskScore = Number(hotspot?.classification?.risk_score ?? 0);
      const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || riskScore >= 70;
      const longitude = Number(hotspot?.hotspot?.longitude);
      const latitude = Number(hotspot?.hotspot?.latitude);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
      const id = String(hotspot.id);
      return {
        type: 'Feature' as const,
        id,
        geometry: { type: 'Point' as const, coordinates: [longitude, latitude] },
        properties: { id, type, isPending, isHighRisk, color, frp: Number(hotspot?.hotspot?.frp ?? 0) },
      };
    }).filter((feature): feature is NonNullable<typeof feature> => feature !== null),
  }), [visibleHotspots]);

  const dataBounds = useMemo(() => {
    if (!visibleHotspots.length) return null;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const hotspot of visibleHotspots) {
      const lon = Number(hotspot?.hotspot?.longitude);
      const lat = Number(hotspot?.hotspot?.latitude);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      minLon = Math.min(minLon, lon); minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon); maxLat = Math.max(maxLat, lat);
    }
    if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return null;
    return { minLon, minLat, maxLon, maxLat };
  }, [visibleHotspots]);

  useEffect(() => {
    if (!mounted || !mapRef.current || hasAutoFitted.current || !dataBounds) return;
    const longitudeSpan = dataBounds.maxLon - dataBounds.minLon;
    const latitudeSpan = dataBounds.maxLat - dataBounds.minLat;
    const padding = 0.15;
    const minLon = dataBounds.minLon - Math.max(longitudeSpan * padding, 1.0);
    const maxLon = dataBounds.maxLon + Math.max(longitudeSpan * padding, 1.0);
    const minLat = dataBounds.minLat - Math.max(latitudeSpan * padding, 0.8);
    const maxLat = dataBounds.maxLat + Math.max(latitudeSpan * padding, 0.8);
    hasAutoFitted.current = true;
    mapRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 80, duration: 700, maxZoom: 8.5 });
  }, [mounted, dataBounds]);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.find((item) => item?.layer?.id === 'unclustered-point');
    if (!feature) {
      onSelectHotspot?.(null);
      return;
    }
    const clickedId = String(feature.properties?.id ?? '');
    if (!clickedId) return;
    const selected = visibleHotspots.find((hotspot) => String(hotspot.id) === clickedId);
    if (selected) onSelectHotspot?.(selected);
  }, [visibleHotspots, onSelectHotspot]);

  const onMouseMove = useCallback((event: MapLayerMouseEvent) => {
    event.target.getCanvas().style.cursor = event.features?.length ? 'pointer' : 'default';
  }, []);

  const onMouseLeave = useCallback((event: MapLayerMouseEvent) => {
    event.target.getCanvas().style.cursor = 'default';
  }, []);

  const baseMapStyle = useMemo(() => {
    const dark = mapStyle === 'Esri Dark Canvas' || mapStyle === 'Carto Dark';
    const tileUrls = dark
      ? ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}']
      : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    const attribution = dark ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ' : '&copy; OpenStreetMap contributors';
    return {
      version: 8,
      sources: { 'osm-tiles': { type: 'raster', tiles: tileUrls, tileSize: 256, attribution, maxzoom: 19 } },
      layers: [{ id: 'osm-tiles-layer', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 19 }],
    };
  }, [mapStyle]);

  const selectedLongitude = Number(selectedHotspot?.hotspot?.longitude);
  const selectedLatitude = Number(selectedHotspot?.hotspot?.latitude);
  const hasValidSelectedCoordinates = Number.isFinite(selectedLongitude) && Number.isFinite(selectedLatitude);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onMoveEnd={onMoveEnd}
        mapStyle={baseMapStyle as any}
        mapLib={maplibregl}
        interactiveLayerIds={['unclustered-point']}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass showZoom />
        <Source id="hotspots" type="geojson" data={geojsonData}>
          <Layer
            id="unclustered-point"
            type="circle"
            paint={{
              'circle-color': [
                'match', ['get', 'type'],
                ClassificationType.INDUSTRIAL_FIRE, CLASSIFICATION_COLORS[ClassificationType.INDUSTRIAL_FIRE],
                ClassificationType.PERSISTENT_INDUSTRIAL_SOURCE, CLASSIFICATION_COLORS[ClassificationType.PERSISTENT_INDUSTRIAL_SOURCE],
                ClassificationType.GAS_FLARE, CLASSIFICATION_COLORS[ClassificationType.GAS_FLARE],
                ClassificationType.WILDFIRE_FOREST_FIRE, CLASSIFICATION_COLORS[ClassificationType.WILDFIRE_FOREST_FIRE],
                ClassificationType.AGRICULTURAL_BURN, CLASSIFICATION_COLORS[ClassificationType.AGRICULTURAL_BURN],
                ClassificationType.MINING_THERMAL_ACTIVITY, CLASSIFICATION_COLORS[ClassificationType.MINING_THERMAL_ACTIVITY],
                ClassificationType.OTHER_THERMAL_ANOMALY, CLASSIFICATION_COLORS[ClassificationType.OTHER_THERMAL_ANOMALY],
                ClassificationType.UNKNOWN_UNCERTAIN, CLASSIFICATION_COLORS[ClassificationType.UNKNOWN_UNCERTAIN],
                '#8a8a8a',
              ],
              'circle-radius': ['case', ['==', ['get', 'id'], String(selectedHotspot?.id ?? '')], 11, ['get', 'isHighRisk'], 7, ['get', 'isPending'], 5, 5],
              'circle-opacity': ['case', ['==', ['get', 'id'], String(selectedHotspot?.id ?? '')], 1, ['get', 'isPending'], 0.55, 0.85],
              'circle-stroke-width': ['case', ['==', ['get', 'id'], String(selectedHotspot?.id ?? '')], 3, ['get', 'isHighRisk'], 2, 1],
              'circle-stroke-color': ['case', ['==', ['get', 'id'], String(selectedHotspot?.id ?? '')], '#ffffff', ['get', 'isHighRisk'], '#ff3b30', ['get', 'isPending'], '#555555', '#111111'],
            }}
          />
        </Source>

        {selectedHotspot && hasValidSelectedCoordinates && (
          <Popup
            longitude={selectedLongitude}
            latitude={selectedLatitude}
            anchor="bottom"
            onClose={() => onSelectHotspot?.(null)}
            closeOnClick={false}
            className="vertex-popup"
          >
            <FirePopup hotspot={selectedHotspot} />
          </Popup>
        )}
      </Map>
    </div>
  );
}
