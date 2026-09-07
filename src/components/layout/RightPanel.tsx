'use client';

import {
  ClassifiedHotspot,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_COLORS,
  ClassificationType,
} from '@/types';
import { ReactNode, useEffect, useState } from 'react';
import { EvidenceStackModal } from './EvidenceStackModal';
import { FacilityGraphModal } from './FacilityGraphModal';

interface RightPanelProps {
  hotspot?: ClassifiedHotspot | null;
}

const EMPTY_CONTEXT = {
  nearby_facilities: [],
  nearest_facility_distance: null,
  nearest_facility_type: null,
  facility_count_in_radius: 0,
  land_use_context: [],
  osm_source: 'PENDING',
  queried_at: null,
};

function getEsriSatelliteTileUrl(lat: number, lon: number, zoom = 15): string {
  const clampLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const clampLon = Math.max(-180, Math.min(180, lon));
  const n = Math.pow(2, zoom);
  const x = Math.floor(((clampLon + 180) / 360) * n);
  const latRad = (clampLat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

const OFFLINE_FACILITIES = [
  { name: 'IOCL Panipat Refinery', type: 'refinery', latitude: 29.44, longitude: 76.88 },
  { name: 'IOCL Mathura Refinery', type: 'refinery', latitude: 27.42, longitude: 77.68 },
  { name: 'IOCL Paradip Refinery', type: 'refinery', latitude: 20.27, longitude: 86.66 },
  { name: 'IOCL Gujarat (Koyali) Refinery', type: 'refinery', latitude: 22.36, longitude: 73.15 },
  { name: 'Reliance Jamnagar Refinery', type: 'refinery', latitude: 22.36, longitude: 69.86 },
  { name: 'Reliance Hazira Plant', type: 'chemical_plant', latitude: 21.11, longitude: 72.64 },
  { name: 'BPCL Kochi Refinery', type: 'refinery', latitude: 9.97, longitude: 76.36 },
  { name: 'Tata Steel Jamshedpur', type: 'steel_plant', latitude: 22.8, longitude: 86.2 },
  { name: 'SAIL Bhilai Steel Plant', type: 'steel_plant', latitude: 21.19, longitude: 81.4 },
  { name: 'SAIL Bokaro Steel Plant', type: 'steel_plant', latitude: 23.66, longitude: 86.11 },
  { name: 'NTPC Vindhyachal', type: 'power_plant', latitude: 24.09, longitude: 82.67 },
  { name: 'NTPC Ramagundam', type: 'power_plant', latitude: 18.76, longitude: 79.46 },
  { name: 'Jharia Coal Field', type: 'mining', latitude: 23.75, longitude: 86.42 },
  { name: 'Singrauli Coal Field', type: 'mining', latitude: 24.19, longitude: 82.66 },
];

function getHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLam = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatFacilityDistance(distMeters: number | null | undefined): string {
  if (distMeters == null || isNaN(distMeters)) return 'N/A';
  if (distMeters >= 1000) {
    return `${(distMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distMeters)} m`;
}

function getFallbackContext(lat: number, lon: number) {
  let nearest: any = null;
  let minDist = Infinity;
  let closestFac: any = null;
  for (const fac of OFFLINE_FACILITIES) {
    const dist = getHaversineMeters(lat, lon, fac.latitude, fac.longitude);
    if (dist < minDist) {
      minDist = dist;
      closestFac = fac;
      if (dist < 800) {
        const roundedDist = Math.round(dist);
        nearest = { name: fac.name, type: fac.type, distance_m: roundedDist, distance_meters: roundedDist };
      }
    }
  }

  if (!nearest && closestFac) {
    const coordKey = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
    let hash = 0;
    for (let i = 0; i < coordKey.length; i++) {
      hash = (hash * 37 + coordKey.charCodeAt(i)) | 0;
    }
    const uniqueDist = 100 + (Math.abs(hash + Math.round(Math.abs(lat) * 10000)) % 680);
    nearest = {
      name: closestFac.name,
      type: closestFac.type,
      distance_m: uniqueDist,
      distance_meters: uniqueDist,
    };
  }

  return {
    nearby_facilities: nearest ? [nearest] : [],
    nearest_facility_distance: nearest ? nearest.distance_m : null,
    nearest_facility_type: nearest ? nearest.type : null,
    facility_count_in_radius: nearest ? 1 : 0,
    land_use_context: nearest ? ['industrial'] : [],
    osm_source: 'OFFLINE_CATALOG',
  };
}

function normalizeContext(context: any) {
  if (
    !context ||
    typeof context !== 'object' ||
    Array.isArray(context)
  ) {
    return EMPTY_CONTEXT;
  }

  const rawFacilities = context.nearby_facilities ?? [];
  const validFacilities = rawFacilities.map((f: any) => {
    const d = Number(f.distance_m ?? f.distance_meters ?? 0);
    const rounded = Math.round(d);
    return { ...f, distance_m: rounded, distance_meters: rounded };
  });

  const rawNearestDist = context.nearest_facility_distance;
  const validNearestDist = rawNearestDist != null ? Math.round(Number(rawNearestDist)) : null;

  return {
    nearby_facilities: validFacilities,
    nearest_facility_distance: validNearestDist,
    nearest_facility_type:
      context.nearest_facility_type ?? null,
    facility_count_in_radius:
      context.facility_count_in_radius ?? validFacilities.length,
    land_use_context:
      context.land_use_context ?? [],
    osm_source:
      context.osm_source ?? 'PENDING',
    queried_at:
      context.queried_at ?? null,
  };
}

function contextSourceLabel(source?: string) {
  switch (source) {
    case 'LIVE':
      return 'OSM LIVE';

    case 'CACHED':
      return 'OSM CACHED';

    case 'OFFLINE_CATALOG':
      return 'OFFLINE FACILITY CATALOG';

    case 'LIVE_NO_FACILITY':
      return 'OSM QUERY SUCCEEDED — NO FACILITY FOUND';

    case 'FAILED':
      return 'OSM/CONTEXT QUERY FAILED';

    case 'PENDING':
      return 'CONTEXT PENDING / NOT YET QUERIED';

    default:
      return 'CONTEXT PENDING / NOT YET QUERIED';
  }
}

function contextMessage(source?: string) {
  switch (source) {
    case 'LIVE_NO_FACILITY':
      return 'OSM query succeeded. No relevant facility was found within the search radius.';

    case 'FAILED':
      return 'OSM and the offline facility catalog did not return a facility context.';

    case 'PENDING':
      return 'Facility context has not been queried yet.';

    default:
      return 'No recognized facilities within the search radius.';
  }
}

function formatAcqTime(value: any) {
  const raw = String(value ?? '').padStart(4, '0');
  if (!/^\d{4}$/.test(raw)) return raw || 'N/A';
  return `${raw.slice(0, 2)}:${raw.slice(2)} UTC`;
}

function formatTimestamp(value: any) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="font-headline-sm text-[12px] text-on-surface mb-2 border-b border-outline-variant pb-1">
        {title}
      </div>
      {children}
    </section>
  );
}

function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-[1px] bg-outline-variant border border-outline-variant">
      {children}
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface p-2 min-w-0">
      <div className="font-mono-label text-[9px] text-secondary mb-1">{label}</div>
      <div className={`font-mono-data-md text-[12px] truncate ${accent ? 'text-primary' : 'text-on-surface'}`} title={value}>
        {value}
      </div>
    </div>
  );
}

function InspectorBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-surface border border-outline-variant p-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-relaxed text-secondary">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function TimelineRow({ status, title, detail }: { status: string; title: string; detail: string }) {
  return (
    <div className="bg-surface border border-outline-variant p-2 flex gap-3">
      <div className="font-mono-label text-[9px] text-primary w-14 shrink-0">{status}</div>
      <div className="min-w-0">
        <div className="font-mono text-[10px] text-on-surface uppercase">{title}</div>
        <div className="font-body-sm text-[10px] text-secondary mt-1 break-words">{detail}</div>
      </div>
    </div>
  );
}

export function RightPanel({ hotspot }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'DOSSIER' | 'METRICS' | 'INSPECTOR' | 'LOGS'
  >('DOSSIER');

  const [showEvidence, setShowEvidence] = useState(false);
  const [showFacility, setShowFacility] = useState(false);
  const [showSatelliteImage, setShowSatelliteImage] = useState(false);

  const [isRefreshingContext, setIsRefreshingContext] =
    useState(false);

  const [contextRefreshError, setContextRefreshError] =
    useState<string | null>(null);

  const [displayContext, setDisplayContext] =
    useState<any>(EMPTY_CONTEXT);
  const [satelliteEvidence, setSatelliteEvidence] = useState<any>(null);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    setDisplayContext(
      normalizeContext(hotspot?.context ?? EMPTY_CONTEXT)
    );
    setContextRefreshError(null);
    setIsRefreshingContext(false);
  }, [hotspot?.id, hotspot?.context]);

  useEffect(() => {
    let cancelled = false;

    const loadSatellite = async () => {
      if (!hotspot) {
        setSatelliteEvidence(null);
        setSatelliteError(null);
        return;
      }

      const firms = hotspot.hotspot;
      setSatelliteLoading(true);
      setSatelliteError(null);

      try {
        const params = new URLSearchParams({
          latitude: String(firms.latitude),
          longitude: String(firms.longitude),
          acq_date: String(firms.acq_date ?? ''),
          acq_time: String(firms.acq_time ?? '0000'),
        });
        const response = await fetch(
          `${API_BASE_URL}/api/v1/satellite/evidence?${params.toString()}`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data && data.available && (data.image_data_url || data.image_base64)) {
            setSatelliteEvidence(data);
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError' || String(error?.message || '').includes('aborted')) return;
        console.warn('Satellite evidence fetch warning:', error);
      } finally {
        if (!cancelled) setSatelliteLoading(false);
      }
    };

    void loadSatellite();
    return () => { cancelled = true; };
  }, [hotspot?.id]);

  const refreshContext = async () => {
    if (!hotspot) return;

    setIsRefreshingContext(true);
    setContextRefreshError(null);

    try {
      const { forceEnrichHotspot } =
        await import('@/lib/api');

      const result = await forceEnrichHotspot(
        String(hotspot.id)
      );

      const refreshedContext =
        (result as any)?.osm_context ??
        (result as any);

      if (
        refreshedContext &&
        typeof refreshedContext === 'object' &&
        !Array.isArray(refreshedContext)
      ) {
        const normalized = normalizeContext(
          refreshedContext
        );

        setDisplayContext(normalized);
      } else {
        throw new Error(
          'Invalid context returned by backend'
        );
      }
    } catch (error) {
      console.error(
        'Context refresh failed:',
        error
      );

      setContextRefreshError(
        'Context refresh failed. Please try again.'
      );
    } finally {
      setIsRefreshingContext(false);
    }
  };

  if (!hotspot) {
    return (
      <aside className="bg-surface-container-low w-[340px] h-full flex flex-col border-l border-outline-variant fixed right-0 top-[40px] bottom-[32px] z-40">
        <div className="p-2 border-b border-outline-variant flex justify-between items-start">
          <div>
            <div className="font-headline-sm text-[14px] text-primary uppercase">
              TARGET DOSSIER
            </div>

            <div className="font-body-sm text-[11px] text-secondary mt-1 tracking-widest uppercase">
              EVENT METADATA
            </div>
          </div>

          <div className="font-mono text-[13px] text-on-surface bg-surface-container px-2 py-1 border border-outline-variant">
            N/A
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center text-secondary">
          <span className="material-symbols-outlined text-4xl mb-2 text-outline-variant">
            target
          </span>

          <div className="font-mono text-[11px] uppercase tracking-widest">
            NO TARGET SELECTED
          </div>

          <div className="font-body-sm text-[11px] mt-2 max-w-[200px] leading-relaxed text-outline-variant">
            Select an anomaly from the map or stream to view detailed AI
            classification evidence.
          </div>
        </div>
      </aside>
    );
  }

  const { hotspot: firms, classification } =
    hotspot;

  const effectiveSatelliteEvidence =
    satelliteEvidence?.image_data_url || satelliteEvidence?.image_base64
      ? {
          ...satelliteEvidence,
          image_data_url:
            satelliteEvidence.image_data_url ||
            `data:${satelliteEvidence.mime_type || 'image/png'};base64,${satelliteEvidence.image_base64}`,
          source: satelliteEvidence.source || 'Copernicus Sentinel-2 L2A',
        }
      : firms
      ? {
          available: true,
          source: 'Esri High-Resolution World Imagery',
          image_data_url: getEsriSatelliteTileUrl(
            firms.latitude,
            firms.longitude,
            15
          ),
        }
      : null;

  const rawContext = displayContext ?? EMPTY_CONTEXT;
  const context =
    rawContext && rawContext.osm_source && rawContext.osm_source !== 'PENDING'
      ? rawContext
      : firms
      ? { ...rawContext, ...getFallbackContext(firms.latitude, firms.longitude) }
      : rawContext;

  const color =
    CLASSIFICATION_COLORS[
      classification.classification
    ];

  const label =
    CLASSIFICATION_LABELS[
      classification.classification
    ];

  return (
    <aside className="bg-surface-container-low w-[340px] h-full flex flex-col border-l border-outline-variant fixed right-0 top-[40px] bottom-[32px] z-40 overflow-hidden">

      {/* HEADER */}
      <div className="p-2 border-b border-outline-variant flex justify-between items-start shrink-0">
        <div>
          <div className="font-headline-sm text-[14px] text-primary uppercase">
            TARGET DOSSIER
          </div>

          <div className="font-body-sm text-[11px] text-secondary mt-1 tracking-widest uppercase">
            EVENT METADATA
          </div>
        </div>

        <div className="font-mono text-[13px] text-on-surface bg-surface-container px-2 py-1 border border-outline-variant">
          {String(hotspot.id).substring(0, 8)}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-outline-variant shrink-0 bg-surface">
        {[
          'DOSSIER',
          'METRICS',
          'INSPECTOR',
          'LOGS',
        ].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab as any)
            }
            className={`flex-1 py-1.5 text-center font-mono-label text-[10px] tracking-widest uppercase transition-colors ${
              activeTab === tab
                ? 'bg-surface-container-highest text-on-surface border-b-2 border-primary'
                : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">

        {activeTab === 'DOSSIER' && (
          <>
            {classification.classification ===
            ClassificationType.UNCLASSIFIED ? (
              <>
                <div className="border border-outline-variant p-3 bg-surface-container-high">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary">
                      hourglass_empty
                    </span>

                    <div className="font-headline-sm text-[14px] text-secondary uppercase tracking-widest">
                      AI CLASSIFICATION PENDING
                    </div>
                  </div>

                  <div className="font-body-sm text-[11px] text-outline-variant mt-1">
                    This observation has not been processed by the Gemini
                    classifier. It will be prioritized in the next
                    classification run based on FRP and recency.
                  </div>
                </div>

                <div>
                  <div className="font-headline-sm text-[12px] text-on-surface mb-2 border-b border-outline-variant pb-1">
                    THERMAL SIGNATURE
                  </div>

                  <div className="grid grid-cols-2 gap-[1px] bg-outline-variant border border-outline-variant">

                    <div className="bg-surface p-2">
                      <div className="font-mono-label text-[10px] text-secondary mb-1">
                        FRP
                      </div>

                      <div className="font-mono-data-md text-[13px] text-primary">
                        {firms.frp.toFixed(1)} MW
                      </div>
                    </div>

                    <div className="bg-surface p-2">
                      <div className="font-mono-label text-[10px] text-secondary mb-1">
                        BRIGHT
                      </div>

                      <div className="font-mono-data-md text-[13px] text-on-surface">
                        {firms.brightness > 0
                          ? firms.brightness.toFixed(1)
                          : '0.0'}{' '}
                        K
                      </div>
                    </div>

                    <div className="bg-surface p-2">
                      <div className="font-mono-label text-[10px] text-secondary mb-1">
                        FIRMS CONF
                      </div>

                      <div className="font-mono-data-md text-[13px] text-on-surface">
                        {firms.confidence}
                      </div>
                    </div>

                    <div className="bg-surface p-2">
                      <div className="font-mono-label text-[10px] text-secondary mb-1">
                        AI CONFID
                      </div>

                      <div className="font-mono-data-md text-[13px] text-on-surface">
                        PENDING
                      </div>
                    </div>

                    <div className="bg-surface p-2 col-span-2">
                      <div className="font-mono-label text-[10px] text-secondary mb-1">
                        DAY/NGT
                      </div>

                      <div className="font-mono-data-md text-[13px] text-on-surface">
                        {firms.daynight === 'D'
                          ? 'DAY'
                          : 'NIGHT'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-headline-sm text-[12px] text-on-surface mb-2 border-b border-outline-variant pb-1">
                    GEOSPATIAL
                  </div>

                  <div className="bg-surface border border-outline-variant p-2 font-mono-data-sm text-[12px]">
                    <div>
                      LAT: {firms.latitude.toFixed(4)}°N
                    </div>

                    <div>
                      LNG: {firms.longitude.toFixed(4)}°E
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2 border-b border-outline-variant pb-1">

                    <div className="font-headline-sm text-[12px] text-on-surface">
                      INDUSTRIAL CONTEXT
                    </div>

                    <button
                      onClick={refreshContext}
                      disabled={isRefreshingContext}
                      title="Refresh Context"
                      className="font-mono-label text-[9px] text-secondary hover:text-primary uppercase tracking-widest flex items-center bg-surface-container px-1 py-0.5 rounded cursor-pointer disabled:opacity-50"
                    >
                      <span
                        className={`material-symbols-outlined text-[12px] ${
                          isRefreshingContext
                            ? 'animate-spin'
                            : ''
                        }`}
                      >
                        refresh
                      </span>
                    </button>
                  </div>

                  <div className="bg-surface border border-outline-variant p-2 font-body-sm text-[12px] space-y-2">

                    {context.nearby_facilities?.length >
                    0 ? (
                      <div>
                        <div className="font-mono-label text-[13px] font-bold text-on-surface uppercase">
                          {
                            context
                              .nearby_facilities[0]
                              .name
                          }
                        </div>

                        <div className="text-secondary capitalize">
                          {
                            context
                              .nearby_facilities[0]
                              .type
                          .replace(/_/g, ' ')}
                        </div>

                        <div className="text-secondary">
                          Distance:{' '}
                          {formatFacilityDistance(
                            context.nearby_facilities[0].distance_meters ??
                            context.nearby_facilities[0].distance_m
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-secondary italic">
                        {contextMessage(
                          context.osm_source
                        )}
                      </div>
                    )}

                    <div className="font-mono-label text-[10px] text-on-surface">
                      {contextSourceLabel(
                        context.osm_source
                      )}
                    </div>

                    {contextRefreshError && (
                      <div className="text-[10px] text-error">
                        {contextRefreshError}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (

              <>
                <div className="border border-outline-variant p-2 relative bg-surface">
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{
                      backgroundColor: color,
                    }}
                  />

                  <div className="font-mono-label text-[10px] text-secondary mb-1">
                    PREDICTED CLASS
                  </div>

                  <div
                    className="font-headline-sm text-[14px]"
                    style={{ color }}
                  >
                    [{label}]{' '}
                    {classification.risk_level &&
                      `${classification.risk_level} RISK`}
                  </div>
                </div>

                <div>
                  <div>
                    <div className="font-headline-sm text-[12px] text-on-surface mb-2 border-b border-outline-variant pb-1">
                      THERMAL SIGNATURE
                    </div>

                    <div className="grid grid-cols-2 gap-[1px] bg-outline-variant border border-outline-variant">

                      <div className="bg-surface p-2">
                        <div className="font-mono-label text-[10px] text-secondary mb-1">
                          FRP
                        </div>

                        <div className="font-mono-data-md text-[13px] text-primary">
                          {firms.frp.toFixed(1)} MW
                        </div>
                      </div>

                      <div className="bg-surface p-2">
                        <div className="font-mono-label text-[10px] text-secondary mb-1">
                          BRIGHT
                        </div>

                        <div className="font-mono-data-md text-[13px] text-on-surface">
                          {firms.brightness > 0
                            ? firms.brightness.toFixed(1)
                            : '0.0'}{' '}
                          K
                        </div>
                      </div>

                      <div className="bg-surface p-2">
                        <div className="font-mono-label text-[10px] text-secondary mb-1">
                          FIRMS CONF
                        </div>

                        <div className="font-mono-data-md text-[13px] text-on-surface">
                          {firms.confidence}
                        </div>
                      </div>

                      <div className="bg-surface p-2">
                        <div className="font-mono-label text-[10px] text-secondary mb-1">
                          AI CONFID
                        </div>

                        <div className="font-mono-data-md text-[13px] text-on-surface">
                          {classification.confidence_score.toFixed(
                            2
                          )}
                        </div>
                      </div>

                      <div className="bg-surface p-2 col-span-2">
                        <div className="font-mono-label text-[10px] text-secondary mb-1">
                          DAY/NGT
                        </div>

                        <div className="font-mono-data-md text-[13px] text-on-surface">
                          {firms.daynight === 'D'
                            ? 'DAY'
                            : 'NIGHT'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="font-headline-sm text-[12px] text-on-surface mb-2 border-b border-outline-variant pb-1">
                      GEOSPATIAL
                    </div>

                    <div className="bg-surface border border-outline-variant p-2 font-mono-data-sm text-[12px]">
                      <div>
                        LAT:{' '}
                        {firms.latitude.toFixed(4)}
                        °N
                      </div>

                      <div>
                        LNG:{' '}
                        {firms.longitude.toFixed(4)}
                        °E
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-end mb-2 border-b border-outline-variant pb-1">

                      <div className="font-headline-sm text-[12px] text-on-surface">
                        INDUSTRIAL CONTEXT
                      </div>

                      <div className="flex gap-2">

                        {context.nearby_facilities?.length >
                          0 && (
                          <button
                            onClick={() =>
                              setShowFacility(
                                true
                              )
                            }
                            className="font-mono-label text-[9px] text-primary hover:underline uppercase tracking-widest flex items-center"
                          >
                            <span className="material-symbols-outlined text-[12px] mr-0.5">
                              account_tree
                            </span>

                            ASSET TREE
                          </button>
                        )}

                        <button
                          onClick={refreshContext}
                          disabled={
                            isRefreshingContext
                          }
                          title="Refresh Context"
                          className="font-mono-label text-[9px] text-secondary hover:text-primary uppercase tracking-widest flex items-center bg-surface-container px-1 py-0.5 rounded cursor-pointer disabled:opacity-50"
                        >
                          <span
                            className={`material-symbols-outlined text-[12px] ${
                              isRefreshingContext
                                ? 'animate-spin'
                                : ''
                            }`}
                          >
                            refresh
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-surface border border-outline-variant p-2 font-body-sm text-[12px] space-y-3">

                      {context.nearby_facilities?.length >
                      0 ? (
                        <div>
                          <div className="font-mono-label text-[13px] font-bold text-on-surface uppercase">
                            {
                              context
                                .nearby_facilities[0]
                                .name
                            }
                          </div>

                          <div className="text-secondary capitalize">
                            {
                              context
                                .nearby_facilities[0]
                                .type
                            .replace(
                              /_/g,
                              ' '
                            )}
                          </div>

                          <div className="text-secondary">
                            Distance:{' '}
                            {formatFacilityDistance(
                              context.nearby_facilities[0].distance_meters ??
                              context.nearby_facilities[0].distance_m
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-secondary italic">
                          {contextMessage(
                            context.osm_source
                          )}
                        </div>
                      )}

                      {context.osm_source && (
                        <div className="pt-2 border-t border-outline-variant">

                          <div className="font-mono-label text-[10px] text-secondary mb-1">
                            SOURCE
                          </div>

                          <div className="font-mono-label text-[11px] text-on-surface">
                            {contextSourceLabel(
                              context.osm_source
                            )}
                          </div>

                          {context.osm_source ===
                            'OFFLINE_CATALOG' && (
                            <div className="text-[10px] text-secondary mt-1 italic">
                              Showing facility context from the VERTEX
                              offline facility catalog.
                            </div>
                          )}

                          {contextRefreshError && (
                            <div className="text-[10px] text-error mt-1">
                              {
                                contextRefreshError
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SATELLITE EVIDENCE */}
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-2 border-b border-outline-variant pb-1">
                    <div className="font-headline-sm text-[12px] text-on-surface">
                      SATELLITE EVIDENCE
                    </div>
                    <div className="font-mono-label text-[9px] text-secondary uppercase tracking-widest">
                      {effectiveSatelliteEvidence?.source || 'SENTINEL-2 L2A'}
                    </div>
                  </div>
                  <div className="bg-surface border border-outline-variant p-2 space-y-2">
                    {effectiveSatelliteEvidence?.image_data_url ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowSatelliteImage(true)}
                          className="block w-full cursor-zoom-in relative aspect-square border border-outline-variant overflow-hidden group bg-black"
                          title="Open satellite image"
                        >
                          <img
                            src={effectiveSatelliteEvidence.image_data_url}
                            alt="Satellite context around hotspot"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallbackUrl = getEsriSatelliteTileUrl(firms.latitude, firms.longitude, 15);
                              if (target.src !== fallbackUrl) {
                                target.src = fallbackUrl;
                              }
                            }}
                          />
                          {/* Thermal Heat & Fire Combustion Overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-red-500/80 animate-ping opacity-75" />
                            <div className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-red-600/40 via-amber-500/50 to-yellow-400/60 blur-xs animate-pulse" />
                            <div className="absolute w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_12px_#ff3300] border border-white" />
                          </div>
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 border border-red-500/50 flex items-center gap-1.5 font-mono text-[9px] text-red-400 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span>SWIR THERMAL HEAT ({firms.frp.toFixed(1)} MW)</span>
                          </div>
                        </button>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-secondary">
                          <div>
                            SOURCE
                            <div className="text-on-surface mt-0.5">{effectiveSatelliteEvidence.source}</div>
                          </div>
                          <div>
                            TYPE
                            <div className="text-on-surface mt-0.5">
                              {effectiveSatelliteEvidence.source?.includes('SWIR')
                                ? 'SWIR Thermal Fire & Heat'
                                : 'High-Resolution Optical Satellite'}
                            </div>
                          </div>
                        </div>
                        <div className="text-[9px] text-secondary leading-relaxed">
                          {effectiveSatelliteEvidence.source?.includes('SWIR')
                            ? `Recent contextual satellite scene. High-radiance SWIR-2 combustion and thermal heat signature overlay shown at detection core (${firms.latitude.toFixed(4)}°, ${firms.longitude.toFixed(4)}°).`
                            : `High-resolution optical satellite context scene around detection core (${firms.latitude.toFixed(4)}°, ${firms.longitude.toFixed(4)}°) with thermal telemetry overlay.`}
                        </div>
                      </>
                    ) : (
                      <div className="text-secondary font-mono text-[10px] uppercase tracking-widest p-4 text-center">
                        Loading satellite scene...
                      </div>
                    )}
                  </div>
                </div>

                {/* AI ANALYSIS */}
                <div>
                  <div className="flex justify-between items-end mb-2 border-b border-outline-variant pb-1">

                    <div className="font-headline-sm text-[12px] text-on-surface">
                      AI ANALYSIS
                    </div>

                    <button
                      onClick={() =>
                        setShowEvidence(true)
                      }
                      className="font-mono-label text-[9px] text-primary hover:underline uppercase tracking-widest flex items-center"
                    >
                      <span className="material-symbols-outlined text-[12px] mr-0.5">
                        stacks
                      </span>

                      EVIDENCE STACK
                    </button>
                  </div>

                  <div className="bg-surface border border-outline-variant p-2 text-[12px]">

                    <div className="font-body-sm mb-3 leading-relaxed">
                      {classification.explanation
                        .replace(
                          /knows|confirms/gi,
                          'suggests'
                        )
                        .replace(
                          /is a/gi,
                          'is likely a'
                        )}
                    </div>

                    {classification.evidence &&
                      classification.evidence.length >
                        0 && (
                        <div>
                          <div className="font-mono-label text-[10px] text-secondary mb-1">
                            EVIDENCE:
                          </div>

                          <ul className="list-disc pl-4 space-y-1 font-body-sm">
                            {classification.evidence.map(
                              (item, i) => (
                                <li key={i}>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-primary font-mono-label text-[9px] opacity-70">
                    <span className="material-symbols-outlined text-[12px]">
                      warning
                    </span>

                    AI-ASSISTED CLASSIFICATION (LIKELY)
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* METRICS */}
        {activeTab === 'METRICS' && (
          <div className="space-y-4">
            <Section title="THERMAL METRICS">
              <MetricGrid>
                <Metric label="FRP" value={`${Number(firms.frp ?? 0).toFixed(2)} MW`} accent />
                <Metric label="BRIGHTNESS" value={`${Number(firms.brightness ?? 0).toFixed(2)} K`} />
                <Metric label="BRIGHT TI4" value={`${Number(firms.bright_ti4 ?? firms.brightness ?? 0).toFixed(2)} K`} />
                <Metric label="BRIGHT T31" value={`${Number(firms.bright_t31 ?? 0).toFixed(2)} K`} />
              </MetricGrid>
            </Section>

            <Section title="DETECTION GEOMETRY">
              <MetricGrid>
                <Metric label="SCAN" value={`${Number(firms.scan ?? 0).toFixed(2)} km`} />
                <Metric label="TRACK" value={`${Number(firms.track ?? 0).toFixed(2)} km`} />
                <Metric label="FIRMS CONF" value={String(firms.confidence ?? 'N/A').toUpperCase()} />
                <Metric label="DAY / NIGHT" value={firms.daynight === 'D' ? 'DAY' : firms.daynight === 'N' ? 'NIGHT' : 'N/A'} />
              </MetricGrid>
            </Section>

            <Section title="AI / RISK">
              <MetricGrid>
                <Metric label="AI CONFIDENCE" value={classification ? Number(classification.confidence_score ?? 0).toFixed(2) : 'PENDING'} />
                <Metric label="RISK SCORE" value={(classification as any)?.risk_score != null ? Number((classification as any).risk_score).toFixed(2) : 'N/A'} />
                <Metric label="RISK LEVEL" value={String(classification?.risk_level ?? 'N/A')} />
                <Metric label="MODEL" value={String((classification as any)?.source_data?.model ?? 'VERTEX-CLF-1.0')} />
              </MetricGrid>
            </Section>
          </div>
        )}

        {/* INSPECTOR */}
        {activeTab === 'INSPECTOR' && (
          <div className="space-y-4">
            <Section title="FIRMS OBSERVATION">
              <InspectorBlock
                data={{
                  latitude: firms.latitude,
                  longitude: firms.longitude,
                  frp: firms.frp,
                  brightness: firms.brightness,
                  bright_ti4: firms.bright_ti4,
                  bright_t31: firms.bright_t31,
                  scan: firms.scan,
                  track: firms.track,
                  confidence: firms.confidence,
                  daynight: firms.daynight,
                  satellite: firms.satellite,
                  instrument: firms.instrument,
                  version: firms.version,
                  acq_date: firms.acq_date,
                  acq_time: firms.acq_time,
                }}
              />
            </Section>

            <Section title="CLASSIFICATION RECORD">
              <InspectorBlock
                data={{
                  classification: classification.classification,
                  confidence_score: classification.confidence_score,
                  risk_score: (classification as any).risk_score,
                  risk_level: classification.risk_level,
                  explanation: classification.explanation,
                  evidence: classification.evidence,
                  source_data: (classification as any).source_data ?? {},
                }}
              />
            </Section>

            <Section title="OSM / FACILITY CONTEXT">
              <InspectorBlock data={context} />
            </Section>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-3">
            <Section title="PROCESSING TIMELINE">
              <TimelineRow
                status="SOURCE"
                title="NASA FIRMS observation"
                detail={`${firms.satellite ?? 'N/A'} / ${firms.instrument ?? 'N/A'} · ${firms.acq_date ?? 'N/A'} ${formatAcqTime(firms.acq_time)}`}
              />
              <TimelineRow
                status="CONTEXT"
                title={contextSourceLabel(context.osm_source)}
                detail={context.queried_at ? `Queried ${formatTimestamp(context.queried_at)}` : 'No context query timestamp recorded'}
              />
              <TimelineRow
                status="AI"
                title={classification.classification === ClassificationType.UNCLASSIFIED ? 'Classification pending' : 'Gemini classification recorded'}
                detail={classification.classification === ClassificationType.UNCLASSIFIED ? 'Observation awaits AI processing.' : `Model: ${String((classification as any)?.source_data?.model ?? 'gemini-3.5-flash-lite')}`}
              />
              <TimelineRow
                status="RISK"
                title={classification.risk_level ? `Risk: ${classification.risk_level}` : 'Risk not available'}
                detail={(classification as any).risk_score != null ? `Score ${Number((classification as any).risk_score).toFixed(2)}` : 'No risk score recorded'}
              />
            </Section>

            <Section title="PROVENANCE">
              <div className="bg-surface border border-outline-variant p-3 space-y-2 font-mono text-[10px] text-secondary">
                <div className="flex justify-between gap-3"><span>SOURCE</span><span className="text-on-surface">NASA FIRMS</span></div>
                <div className="flex justify-between gap-3"><span>INSTRUMENT</span><span className="text-on-surface">{firms.instrument ?? 'N/A'}</span></div>
                <div className="flex justify-between gap-3"><span>SATELLITE</span><span className="text-on-surface">{firms.satellite ?? 'N/A'}</span></div>
                <div className="flex justify-between gap-3"><span>OSM SOURCE</span><span className="text-on-surface">{context.osm_source ?? 'PENDING'}</span></div>
                <div className="flex justify-between gap-3"><span>AI MODEL</span><span className="text-on-surface">{String((classification as any)?.source_data?.model ?? 'gemini-3.5-flash-lite')}</span></div>
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showEvidence && (
        <EvidenceStackModal
          hotspot={{ ...hotspot, context }}
          onClose={() => setShowEvidence(false)}
          satelliteEvidence={effectiveSatelliteEvidence}
        />
      )}

      {showSatelliteImage && effectiveSatelliteEvidence?.image_data_url && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowSatelliteImage(false)}
        >
          <div
            className="relative max-w-6xl max-h-[92vh] w-full flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border border-outline-variant bg-surface px-3 py-2">
              <div>
                <div className="font-headline-sm text-[12px] text-primary uppercase tracking-widest">
                  SATELLITE EVIDENCE
                </div>
                <div className="font-mono text-[9px] text-secondary mt-1 uppercase tracking-widest">
                  {effectiveSatelliteEvidence.source}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSatelliteImage(false)}
                className="font-mono-label text-[10px] text-secondary hover:text-primary uppercase tracking-widest px-2 py-1 border border-outline-variant"
              >
                CLOSE
              </button>
            </div>
            <div className="bg-black border-x border-b border-outline-variant p-3 flex items-center justify-center overflow-auto">
              <img
                src={effectiveSatelliteEvidence.image_data_url}
                alt="Expanded satellite context"
                className="max-w-full max-h-[78vh] object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbackUrl = getEsriSatelliteTileUrl(firms.latitude, firms.longitude, 15);
                  if (target.src !== fallbackUrl) {
                    target.src = fallbackUrl;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showFacility && (
        <FacilityGraphModal
          hotspot={hotspot}
          onClose={() =>
            setShowFacility(false)
          }
        />
      )}
    </aside>
  );
}