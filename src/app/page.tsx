'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import {
  ClassifiedHotspot,
  ClassificationType,
} from '@/types';

import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { BottomTicker } from '@/components/layout/BottomTicker';

import {
  INDIA_CENTER,
  INDIA_ZOOM,
  isWithinIndia,
} from '@/lib/constants';

import { useGlobalState } from '@/lib/GlobalStateContext';

const MapView = dynamic(
  () =>
    import('@/components/map/MapView').then(
      (mod) => mod.MapView
    ),
  {
    ssr: false,
  }
);

interface FilterState {
  classifications: ClassificationType[];
  minFrp: number;
  maxFrp: number;
  minConfidence: number;
  riskLevels: string[];
}

export default function DashboardPage() {
  const {
    hotspots,
    mapHotspots,
    loading,
    error,
    selectedHotspot,
    setSelectedHotspot,
  } = useGlobalState();

  /*
   * =========================================================
   * FILTERS
   * =========================================================
   *
   * These filters apply to the classified / priority hotspot
   * stream used by the sidebar and dashboard controls.
   *
   * The map itself is handled by MapView, which now consumes
   * the complete current FIRMS observation stream through
   * GlobalStateContext.
   */

  const [filters, setFilters] = useState<FilterState>({
    classifications: [],
    minFrp: 0,
    maxFrp: 1000,
    minConfidence: 0,
    riskLevels: [],
  });

  /*
   * =========================================================
   * FILTER HOTSPOTS
   * =========================================================
   */

  /*
   * =========================================================
   * MERGE CLASSIFICATION DATA INTO MAP OBSERVATIONS
   * =========================================================
   *
   * The FIRMS map stream contains every current observation,
   * while the classified stream contains the AI/enrichment data.
   *
   * Match them by the FIRMS observation identity (coordinates,
   * acquisition date/time, satellite) so map markers inherit
   * their real classification, confidence, risk and context.
   */
  const hotspotIdentity = (h: ClassifiedHotspot) => {
    const lat = Number(h?.hotspot?.latitude);
    const lon = Number(h?.hotspot?.longitude);
    const date = String(h?.hotspot?.acq_date ?? '');
    const timeRaw = String(h?.hotspot?.acq_time ?? '');
    const time = timeRaw.padStart(4, '0');
    const satellite = String(h?.hotspot?.satellite ?? '');

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return '';
    }

    return `${lat.toFixed(5)}|${lon.toFixed(5)}|${date}|${time}|${satellite}`;
  };

  const classifiedByIdentity = useMemo(() => {
    const index = new Map<string, ClassifiedHotspot>();

    for (const hotspot of hotspots) {
      const key = hotspotIdentity(hotspot);
      if (key) {
        index.set(key, hotspot);
      }
    }

    return index;
  }, [hotspots]);

  const mergedMapHotspots = useMemo(() => {
    const mapList = Array.isArray(mapHotspots) ? mapHotspots : [];
    if (mapList.length === 0) {
      return hotspots;
    }

    const classifiedMap = new Map<string, ClassifiedHotspot>();
    const includedIds = new Set<string>();

    for (const h of hotspots) {
      classifiedMap.set(String(h.id), h);
      const key = hotspotIdentity(h);
      if (key) classifiedMap.set(key, h);
    }

    const merged = mapList.map((mapHotspot) => {
      const key = hotspotIdentity(mapHotspot);
      const match =
        (key ? classifiedMap.get(key) : undefined) ||
        classifiedMap.get(String(mapHotspot.id)) ||
        (key ? classifiedByIdentity.get(key) : undefined);

      if (!match) {
        return mapHotspot;
      }

      includedIds.add(String(match.id));
      includedIds.add(String(mapHotspot.id));

      return {
        ...mapHotspot,
        id: match.id,
        hotspot: {
          ...mapHotspot.hotspot,
          ...match.hotspot,
        },
        classification: match.classification,
        context: match.context,
      } as ClassifiedHotspot;
    });

    for (const h of hotspots) {
      if (!includedIds.has(String(h.id))) {
        merged.push(h);
      }
    }

    return merged;
  }, [mapHotspots, hotspots, classifiedByIdentity]);

  /*
   * =========================================================
   * FILTER ONE UNIFIED DATASET
   * =========================================================
   *
   * The same filters are applied to:
   *   1. Sidebar classified events
   *   2. Map FIRMS observations
   *
   * This keeps the UI and map synchronized.
   */
  const matchesFilters = (h: ClassifiedHotspot) => {
    const lat = Number(h?.hotspot?.latitude);
    const lon = Number(h?.hotspot?.longitude);
    if (!isWithinIndia(lat, lon)) {
      return false;
    }

    const classification =
      h?.classification?.classification ??
      ClassificationType.UNCLASSIFIED;

    const frp = Number(h?.hotspot?.frp ?? 0);
    const confidence = Number(
      h?.classification?.confidence_score ?? 0
    );
    const risk = String(
      h?.classification?.risk_level ?? ''
    ).toUpperCase();

    if (
      filters.classifications.length > 0 &&
      !filters.classifications.includes(classification)
    ) {
      return false;
    }

    if (
      frp < filters.minFrp ||
      frp > filters.maxFrp
    ) {
      return false;
    }

    if (confidence < filters.minConfidence) {
      return false;
    }

    if (
      filters.riskLevels.length > 0 &&
      !filters.riskLevels.includes(risk)
    ) {
      return false;
    }

    return true;
  };

  const filteredHotspots = useMemo(() => {
    return hotspots.filter(matchesFilters);
  }, [hotspots, filters]);

  const filteredMapHotspots = useMemo(() => {
    return mergedMapHotspots.filter(matchesFilters);
  }, [mergedMapHotspots, filters]);


  /*
   * =========================================================
   * KEEP SELECTED HOTSPOT IN SYNC
   * =========================================================
   *
   * Do not maintain a second OSM-context store here.
   *
   * The selected hotspot already comes from GlobalStateContext,
   * while fresh OSM enrichment is handled by RightPanel and
   * persisted by the backend/Supabase layer.
   */

  const persistedSelectedHotspot = useMemo(() => {
    if (!selectedHotspot) {
      return null;
    }

    /*
     * If the selected hotspot still exists in the current
     * classified stream, use the latest object from that stream.
     *
     * This prevents stale classification/hotspot data from
     * remaining selected after a refresh.
     */

    const currentHotspot =
      filteredMapHotspots.find(
        (hotspot) =>
          String(hotspot.id) === String(selectedHotspot.id)
      ) ??
      hotspots.find(
        (hotspot) =>
          String(hotspot.id) === String(selectedHotspot.id)
      );

    return currentHotspot ?? selectedHotspot;
  }, [selectedHotspot, hotspots, filteredMapHotspots]);

  /*
   * =========================================================
   * SELECT HOTSPOT
   * =========================================================
   *
   * MapView may call this with null when the map selection
   * is cleared.
   *
   * Always handle null safely.
   */

  const handleSelectHotspot = (
    hotspot: ClassifiedHotspot | null
  ) => {
    if (!hotspot) {
      setSelectedHotspot(null);
      return;
    }

    setSelectedHotspot(hotspot);
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      <div
        className="
          flex-1
          relative
          w-full
          overflow-hidden
          mt-[40px]
          mb-[32px]
        "
      >
        {/* =================================================
            SIDEBAR
            ================================================= */}

        <Sidebar
          hotspots={filteredHotspots}
          selectedId={
            persistedSelectedHotspot?.id
          }
          onSelect={handleSelectHotspot}
          onFiltersChange={setFilters}
        />

        {/* =================================================
            MAIN MAP
            ================================================= */}

        <main
          className="
            absolute
            inset-0
            z-0
            bg-surface-dim
            ml-[300px]
            mr-[340px]
            overflow-hidden
          "
        >
          {/* ===============================================
              LOADING
              =============================================== */}

          {loading ? (
            <div
              className="
                w-full
                h-full
                flex
                flex-col
                items-center
                justify-center
                bg-surface-dim
                text-secondary
                space-y-4
              "
            >
              <span
                className="
                  material-symbols-outlined
                  text-4xl
                  animate-spin
                "
              >
                refresh
              </span>

              <span
                className="
                  font-mono
                  text-sm
                  tracking-widest
                  uppercase
                "
              >
                Initializing Geospatial Telemetry...
              </span>
            </div>
          ) : error ? (
            /* =============================================
               ERROR
               ============================================= */

            <div
              className="
                w-full
                h-full
                flex
                items-center
                justify-center
                bg-surface-dim
              "
            >
              <div
                className="
                  bg-error-container
                  border
                  border-error
                  p-6
                  max-w-md
                  text-center
                  text-on-error-container
                "
              >
                <span
                  className="
                    material-symbols-outlined
                    text-4xl
                    mb-2
                    text-error
                  "
                >
                  warning
                </span>

                <div
                  className="
                    font-headline-sm
                    uppercase
                    tracking-widest
                    mb-2
                  "
                >
                  SYSTEM ERROR
                </div>

                <div
                  className="
                    font-mono
                    text-xs
                  "
                >
                  {error}
                </div>
              </div>
            </div>
          ) : (
            /* =============================================
               MAP
               ============================================= */

            <div
              className="
                w-full
                h-full
              "
            >
              <MapView
                /*
                 * Single authoritative map dataset.
                 *
                 * It has already been merged with the latest
                 * classification/context data and passed through
                 * every active filter.
                 */
                hotspots={filteredMapHotspots}
                selectedHotspot={
                  persistedSelectedHotspot
                }
                onSelectHotspot={
                  handleSelectHotspot
                }
                center={INDIA_CENTER}
                zoom={INDIA_ZOOM}
              />
            </div>
          )}
        </main>

        {/* =================================================
            RIGHT PANEL
            ================================================= */}

        <RightPanel
          hotspot={persistedSelectedHotspot}
        />
      </div>

      {/* ===================================================
          BOTTOM TICKER
          =================================================== */}

      <BottomTicker
        hotspots={hotspots}
      />
    </>
  );
}