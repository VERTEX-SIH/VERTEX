'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGlobalState } from '@/lib/GlobalStateContext';
import {
  ClassifiedHotspot,
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  ClassificationType,
} from '@/types';

interface FilterState {
  classifications: ClassificationType[];
  minFrp: number;
  maxFrp: number;
  minConfidence: number;
  riskLevels: string[];
}

interface SidebarProps {
  hotspots?: ClassifiedHotspot[];
  selectedId?: string;
  onSelect?: (hotspot: ClassifiedHotspot) => void;
  onFiltersChange?: (filters: FilterState) => void;
}

export function Sidebar({
  hotspots = [],
  selectedId,
  onSelect,
  onFiltersChange,
}: SidebarProps) {
  const {
    streamFilter,
    setStreamFilter,
    hotspots: globalHotspots,
  } = useGlobalState();

  const sourceHotspots =
    globalHotspots && globalHotspots.length > 0
      ? globalHotspots
      : hotspots;

  const [activeTab, setActiveTab] = useState<
    'STREAM' | 'FILTER' | 'LAYERS'
  >('STREAM');

  const riskOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MODERATE: 2,
    LOW: 3,
  };

  const sortedHotspots = useMemo(() => {
    let filtered = sourceHotspots;

    if (streamFilter === 'CLASSIFIED') {
      filtered = hotspots.filter(
        (h) =>
          h.classification?.classification !==
          ClassificationType.UNCLASSIFIED
      );
    } else if (streamFilter === 'PENDING') {
      filtered = hotspots.filter(
        (h) =>
          h.classification?.classification ===
          ClassificationType.UNCLASSIFIED
      );
    }

    return [...filtered].sort((a, b) => {
      const aClassified =
        a.classification?.classification !==
        ClassificationType.UNCLASSIFIED;

      const bClassified =
        b.classification?.classification !==
        ClassificationType.UNCLASSIFIED;

      if (aClassified && !bClassified) {
        return -1;
      }

      if (!aClassified && bClassified) {
        return 1;
      }

      if (aClassified && bClassified) {
        const aRisk =
          riskOrder[
            a.classification.risk_level || 'LOW'
          ] ?? 4;

        const bRisk =
          riskOrder[
            b.classification.risk_level || 'LOW'
          ] ?? 4;

        if (aRisk !== bRisk) {
          return aRisk - bRisk;
        }
      }

      return (
        (b.hotspot.frp || 0) -
        (a.hotspot.frp || 0)
      );
    });
  }, [sourceHotspots, hotspots, streamFilter]);

  const [draftFilters, setDraftFilters] = useState<FilterState>({
    classifications: [],
    minFrp: 0,
    maxFrp: 1000,
    minConfidence: 0,
    riskLevels: [],
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    classifications: [],
    minFrp: 0,
    maxFrp: 1000,
    minConfidence: 0,
    riskLevels: [],
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.classifications.length > 0) count += appliedFilters.classifications.length;
    if (appliedFilters.minConfidence > 0) count += 1;
    if (appliedFilters.minFrp > 0 || appliedFilters.maxFrp < 1000) count += 1;
    if (appliedFilters.riskLevels.length > 0) count += appliedFilters.riskLevels.length;
    return count;
  }, [appliedFilters]);

  const isFilterModified = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  }, [draftFilters, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    onFiltersChange?.(draftFilters);
  };

  const handleResetFilters = () => {
    const empty: FilterState = {
      classifications: [],
      minFrp: 0,
      maxFrp: 1000,
      minConfidence: 0,
      riskLevels: [],
    };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    onFiltersChange?.(empty);
  };

  const toggleClassification = (type: ClassificationType) => {
    setDraftFilters((prev) => ({
      ...prev,
      classifications: prev.classifications.includes(type)
        ? prev.classifications.filter((t) => t !== type)
        : [...prev.classifications, type],
    }));
  };

  const toggleRiskLevel = (level: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      riskLevels: prev.riskLevels.includes(level)
        ? prev.riskLevels.filter((l) => l !== level)
        : [...prev.riskLevels, level],
    }));
  };

  return (
    <aside className="bg-surface-container-low w-[300px] h-full flex flex-col border-r border-outline-variant fixed left-0 top-[40px] bottom-[32px] z-40 overflow-hidden">

      {/* HEADER */}
      <div className="p-2 border-b border-outline-variant shrink-0">
        <div className="font-headline-sm text-[14px] text-primary">
          ANOMALY STREAM
        </div>

        <div className="font-body-sm text-[11px] text-secondary mt-1 tracking-widest uppercase">
          REAL-TIME THERMAL EVENTS
        </div>
      </div>

      {/* MAIN TABS */}
      <div className="flex border-b border-outline-variant bg-surface shrink-0">

        <button
          onClick={() => setActiveTab('STREAM')}
          className={`flex-1 py-2 flex flex-col items-center transition-colors border-b-2 ${
            activeTab === 'STREAM'
              ? 'border-primary bg-surface-container-highest text-on-surface'
              : 'border-transparent text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] mb-1 font-mono">
            radar
          </span>

          <span className="font-mono-label text-[10px] tracking-widest">
            STREAM
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FILTER')}
          className={`flex-1 py-2 flex flex-col items-center transition-colors border-b-2 relative ${
            activeTab === 'FILTER'
              ? 'border-primary bg-surface-container-highest text-on-surface'
              : 'border-transparent text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] mb-1 font-mono">
            filter_alt
          </span>

          <span className="font-mono-label text-[10px] tracking-widest flex items-center gap-1">
            FILTER
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LAYERS')}
          className={`flex-1 py-2 flex flex-col items-center transition-colors border-b-2 ${
            activeTab === 'LAYERS'
              ? 'border-primary bg-surface-container-highest text-on-surface'
              : 'border-transparent text-secondary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] mb-1 font-mono">
            layers
          </span>

          <span className="font-mono-label text-[10px] tracking-widest">
            LAYERS
          </span>
        </button>

      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {/* ================================================= */}
        {/* STREAM */}
        {/* ================================================= */}

        {activeTab === 'STREAM' && (
          <>
            {/* STREAM FILTER */}
            <div className="flex border-b border-outline-variant bg-surface shrink-0">

              <button
                onClick={() => setStreamFilter('ALL')}
                className={`flex-1 py-1.5 text-center font-mono-label text-[10px] tracking-widest uppercase transition-colors ${
                  streamFilter === 'ALL'
                    ? 'bg-surface-container-highest text-on-surface border-b-2 border-primary'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                ALL
              </button>

              <button
                onClick={() => setStreamFilter('CLASSIFIED')}
                className={`flex-1 py-1.5 text-center font-mono-label text-[10px] tracking-widest uppercase transition-colors ${
                  streamFilter === 'CLASSIFIED'
                    ? 'bg-surface-container-highest text-on-surface border-b-2 border-primary'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                CLASSIFIED
              </button>

              <button
                onClick={() => setStreamFilter('PENDING')}
                className={`flex-1 py-1.5 text-center font-mono-label text-[10px] tracking-widest uppercase transition-colors ${
                  streamFilter === 'PENDING'
                    ? 'bg-surface-container-highest text-on-surface border-b-2 border-primary'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                PENDING
              </button>

            </div>

            {/* HOTSPOT LIST */}
            <div className="px-2 py-1 border-b border-outline-variant bg-surface-container-lowest shrink-0">
              <div className="font-mono text-[9px] text-secondary uppercase tracking-widest">
                {sortedHotspots.length} PRIORITY EVENTS
              </div>
            </div>
            {sortedHotspots.length > 0 ? (

              sortedHotspots.map(
                (h, i) => {

                  const classification =
                    h.classification
                      .classification;

                  const isPending =
                    classification ===
                    ClassificationType.UNCLASSIFIED;

                  const context =
                    h.context;

                  const confidence =
                    Number(
                      h.classification
                        .confidence_score
                    ) || 0;

                  return (
                    <div
                      key={
                        h.id || `hotspot-${i}`
                      }
                      onClick={() => onSelect?.(h)}
                      className={`px-2 py-3 border-b border-outline-variant cursor-pointer hover:bg-surface-container-highest transition-colors flex items-start gap-3 ${
                        selectedId === h.id
                          ? 'border-l-2 border-l-primary bg-surface-container-highest'
                          : 'border-l-2 border-l-transparent'
                      }`}
                    >

                      {/* RANK */}
                      <div className="w-6 shrink-0 mt-0.5">
                        <div className="font-mono text-[12px] font-bold text-primary text-center">
                          {i + 1}
                        </div>

                        <div className="font-mono text-[8px] text-secondary text-center mt-0.5">
                          PRI
                        </div>
                      </div>

                      {/* FIRE ICON */}
                      <div className="mt-1 shrink-0">
                        <span
                          className="material-symbols-outlined text-lg"
                          style={{
                            color:
                              CLASSIFICATION_COLORS[
                                classification as ClassificationType
                              ] || '#888',
                          }}
                        >
                          local_fire_department
                        </span>
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 overflow-hidden">

                        {/* ID + CONFIDENCE */}
                        <div className="flex justify-between items-center mb-1">

                          <span className="font-mono text-[10px] text-on-surface font-bold">
                            VTX-{h.id}
                          </span>

                          <span className="font-mono text-[11px] text-secondary bg-surface-container-high px-1 border border-outline-variant">
                            {isPending
                              ? 'PENDING'
                              : confidence.toFixed(
                                  2
                                )}
                          </span>

                        </div>

                        {/* CLASSIFICATION */}
                        <div className="font-headline-sm text-[13px] text-on-surface uppercase tracking-widest truncate">
                          {CLASSIFICATION_LABELS[
                            classification as ClassificationType
                          ] ||
                            'UNKNOWN_UNCERTAIN'}
                        </div>

                        {/* OSM CONTEXT */}
                        <div className="font-body-sm text-[11px] text-secondary mt-1 truncate">

                          {(() => {

                            if (!context) {
                              return 'Facility not queried';
                            }

                            if (
                              context.nearby_facilities &&
                              context.nearby_facilities.length >
                                0
                            ) {
                              return `${
                                context.nearest_facility_type ||
                                'Facility'
                              } (${
                                context.nearest_facility_distance != null
                                  ? Math.min(context.nearest_facility_distance, 1000).toFixed(
                                      0
                                    )
                                  : '?'
                              }m)`;
                            }

                            if (
                              context.osm_source ===
                              'PENDING'
                            ) {
                              return 'Facility Context Pending...';
                            }

                            if (
                              context.osm_source ===
                                'CACHED_NO_FACILITY' ||
                              context.osm_source ===
                                'LIVE_NO_FACILITY' ||
                              context.osm_source ===
                                'OFFLINE_CATALOG'
                            ) {
                              return 'No facilities found';
                            }

                            if (
                              context.osm_source ===
                              'FAILED'
                            ) {
                              return 'Facility query failed';
                            }

                            if (
                              isPending
                            ) {
                              return 'Facility not queried';
                            }

                            return 'Facility unavailable';

                          })()}

                        </div>

                      </div>

                    </div>
                  );
                }
              )

            ) : (

              <div className="p-4 text-center mt-8">

                <span className="material-symbols-outlined text-4xl text-outline-variant animate-pulse">
                  satellite_alt
                </span>

                <div className="font-mono text-[11px] text-secondary mt-4 uppercase tracking-widest">
                  Awaiting Live Telemetry
                </div>

              </div>

            )}

          </>
        )}

        {/* ================================================= */}
        {/* FILTER */}
        {/* ================================================= */}

        {activeTab === 'FILTER' && (
          <div className="p-4 space-y-6">

            {/* CLASSIFICATION */}
            <div>

              <div className="font-mono-label text-[10px] text-secondary mb-2 tracking-widest">
                CLASSIFICATION TYPE
              </div>

              <div className="space-y-2">

                {Object.values(
                  ClassificationType
                ).map(
                  (type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer group"
                    >

                      <input
                        type="checkbox"
                        checked={draftFilters.classifications.includes(
                          type
                        )}
                        onChange={() =>
                          toggleClassification(
                            type
                          )
                        }
                        className="accent-primary w-3.5 h-3.5 bg-surface border-outline-variant cursor-pointer"
                      />

                      <div
                        className="w-2.5 h-2.5 shrink-0"
                        style={{
                          backgroundColor:
                            CLASSIFICATION_COLORS[
                              type
                            ],
                        }}
                      />

                      <span className="font-body-sm text-[11px] group-hover:text-primary transition-colors">
                        {
                          CLASSIFICATION_LABELS[
                            type
                          ]
                        }
                      </span>

                    </label>
                  )
                )}

              </div>

            </div>

            {/* CONFIDENCE */}
            <div>

              <div className="font-mono-label text-[10px] text-secondary mb-2 tracking-widest">
                MIN CONFIDENCE (
                {draftFilters.minConfidence.toFixed(
                  2
                )}
                )
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={
                  draftFilters.minConfidence
                }
                onChange={(e) =>
                  setDraftFilters(
                    (prev) => ({
                      ...prev,
                      minConfidence:
                        parseFloat(
                          e.target.value
                        ),
                    })
                  )
                }
                className="w-full accent-primary cursor-pointer"
              />

            </div>

            {/* FRP */}
            <div>

              <div className="font-mono-label text-[10px] text-secondary mb-2 tracking-widest">
                FIRE RADIATIVE POWER (MW)
              </div>

              <div className="flex gap-2 items-center">

                <input
                  type="number"
                  value={
                    draftFilters.minFrp
                  }
                  onChange={(e) =>
                    setDraftFilters(
                      (prev) => ({
                        ...prev,
                        minFrp:
                          parseFloat(
                            e.target.value
                          ) || 0,
                      })
                    )
                  }
                  className="w-full bg-surface-container border border-outline-variant px-2 py-1 font-mono text-[11px] text-on-surface focus:border-primary outline-none"
                  placeholder="Min"
                />

                <span className="text-secondary">
                  -
                </span>

                <input
                  type="number"
                  value={
                    draftFilters.maxFrp
                  }
                  onChange={(e) =>
                    setDraftFilters(
                      (prev) => ({
                        ...prev,
                        maxFrp:
                          parseFloat(
                            e.target.value
                          ) || 1000,
                      })
                    )
                  }
                  className="w-full bg-surface-container border border-outline-variant px-2 py-1 font-mono text-[11px] text-on-surface focus:border-primary outline-none"
                  placeholder="Max"
                />

              </div>

            </div>

            {/* RISK */}
            <div>

              <div className="font-mono-label text-[10px] text-secondary mb-2 tracking-widest">
                RISK LEVEL
              </div>

              <div className="space-y-2">

                {[
                  'CRITICAL',
                  'HIGH',
                  'MODERATE',
                  'LOW',
                ].map(
                  (level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 cursor-pointer group"
                    >

                      <input
                        type="checkbox"
                        checked={draftFilters.riskLevels.includes(
                          level
                        )}
                        onChange={() =>
                          toggleRiskLevel(
                            level
                          )
                        }
                        className="accent-primary w-3.5 h-3.5 bg-surface border-outline-variant cursor-pointer"
                      />

                      <span className="font-body-sm text-[11px] group-hover:text-primary transition-colors">
                        {level}
                      </span>

                    </label>
                  )
                )}

              </div>

            </div>

            {/* BOTTOM APPLY & RESET BUTTONS */}
            <div className="space-y-2 pt-4 border-t border-outline-variant">
              <button
                type="button"
                id="apply-filters-btn"
                onClick={handleApplyFilters}
                className={`w-full py-2.5 px-3 font-mono-label text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isFilterModified
                    ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-1 hover:brightness-110'
                    : 'bg-primary text-on-primary hover:brightness-105'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                APPLY FILTERS {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-1.5 bg-surface-container border border-outline-variant text-secondary font-mono-label text-[10px] tracking-widest uppercase hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                RESET FILTERS
              </button>
            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* LAYERS */}
        {/* ================================================= */}

        {activeTab === 'LAYERS' && (
          <div className="flex flex-col items-center justify-center h-40 text-secondary">

            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">
              layers_clear
            </span>

            <div className="font-mono text-[10px] uppercase tracking-widest">
              NO CUSTOM LAYERS
            </div>

          </div>
        )}

      </div>
    </aside>
  );
}