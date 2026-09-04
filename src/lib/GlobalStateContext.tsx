'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import {
  ClassifiedHotspot,
  ClassificationType,
} from '@/types';

import {
  fetchClassifiedHotspots,
  fetchAnalyticsSummary,
  enrichTop50Hotspots,
} from '@/lib/api';

import {
  DEMO_HOTSPOTS,
  generateDemoSummary,
} from './demo-data';

import {
  INDIA_CENTER,
  INDIA_ZOOM,
} from './constants';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';


/*
 * =========================================================
 * GLOBAL STATE INTERFACE
 * =========================================================
 */

interface GlobalState {
  hotspots: ClassifiedHotspot[];
  mapHotspots: ClassifiedHotspot[];
  analyticsSummary: any;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  selectedHotspot: ClassifiedHotspot | null;

  setSelectedHotspot: (
    hotspot: ClassifiedHotspot | null
  ) => void;

  mapStyle: string;

  setMapStyle: (
    style: string
  ) => void;

  streamFilter: string;

  setStreamFilter: (
    filter: string
  ) => void;

  mapCenter: [number, number];

  setMapCenter: (
    center: [number, number]
  ) => void;

  mapZoom: number;

  setMapZoom: (
    zoom: number
  ) => void;

  refreshData: () => Promise<void>;
}


/*
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const GlobalStateContext =
  createContext<
    GlobalState | undefined
  >(undefined);


/*
 * =========================================================
 * OBSERVATION HELPERS
 * =========================================================
 *
 * Never rely only on frontend/backend IDs because the live
 * FIRMS stream and the persisted VERTEX stream can use
 * different IDs.
 *
 * FIRMS observation identity:
 *
 * latitude
 * longitude
 * acquisition date
 * acquisition time
 */

function normalizeAcqTime(
  value: unknown
): string {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const digits =
    String(value)
      .trim()
      .replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return digits
    .padStart(4, '0')
    .slice(-4);
}


function getObservationKey(
  hotspot: ClassifiedHotspot
): string {

  const h =
    hotspot.hotspot;

  const latitude =
    Number(h.latitude);

  const longitude =
    Number(h.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return '';
  }

  const date =
    String(h.acq_date || '')
      .slice(0, 10);

  const time =
    normalizeAcqTime(
      h.acq_time
    );

  return [
    latitude.toFixed(6),
    longitude.toFixed(6),
    date,
    time,
  ].join('|');
}


/*
 * =========================================================
 * MERGE BACKEND CLASSIFICATIONS INTO LIVE MAP DATA
 * =========================================================
 *
 * currentMapData:
 *     every FIRMS observation currently visible
 *
 * classifiedData:
 *     persisted VERTEX observations containing:
 *       - Gemini classification
 *       - confidence
 *       - risk
 *       - OSM context
 *       - evidence
 *
 * The classified backend object wins whenever the same FIRMS
 * observation exists in both streams.
 */

function mergeClassifiedIntoMap(
  currentMapData: ClassifiedHotspot[],
  classifiedData: ClassifiedHotspot[]
): ClassifiedHotspot[] {

  const classifiedByKey =
    new Map<
      string,
      ClassifiedHotspot
    >();

  for (
    const classified
    of classifiedData
  ) {

    const key =
      getObservationKey(
        classified
      );

    if (key) {
      classifiedByKey.set(
        key,
        classified
      );
    }
  }

  return currentMapData.map(
    (
      liveHotspot
    ) => {

      const key =
        getObservationKey(
          liveHotspot
        );

      if (!key) {
        return liveHotspot;
      }

      const classified =
        classifiedByKey.get(
          key
        );

      if (!classified) {
        return liveHotspot;
      }

      /*
       * Preserve the live FIRMS observation, but replace the
       * synthetic PENDING classification and context with the
       * authoritative backend state.
       */

      return {
        ...liveHotspot,

        id:
          classified.id,

        hotspot: {
          ...liveHotspot.hotspot,
          ...classified.hotspot,
        },

        classification:
          classified.classification,

        context:
          classified.context,
      };
    }
  );
}


/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export function GlobalStateProvider({
  children,
}: {
  children: ReactNode;
}) {

  /*
   * -------------------------------------------------------
   * HOTSPOTS
   * -------------------------------------------------------
   */

  const [
    hotspots,
    setHotspots,
  ] = useState<
    ClassifiedHotspot[]
  >([]);

  const [
    mapHotspots,
    setMapHotspots,
  ] = useState<
    ClassifiedHotspot[]
  >([]);


  /*
   * -------------------------------------------------------
   * ANALYTICS
   * -------------------------------------------------------
   */

  const [
    analyticsSummary,
    setAnalyticsSummary,
  ] = useState<any>(null);


  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  const [
    loading,
    setLoading,
  ] = useState(true);


  /*
   * -------------------------------------------------------
   * ERROR
   * -------------------------------------------------------
   */

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  /*
   * -------------------------------------------------------
   * DEMO MODE
   * -------------------------------------------------------
   */

  const [
    isDemoMode,
    setIsDemoMode,
  ] = useState(false);


  /*
   * =======================================================
   * SELECTED HOTSPOT
   * =======================================================
   */

  const [
    selectedHotspot,
    setSelectedHotspotState,
  ] = useState<
    ClassifiedHotspot | null
  >(null);


  const setSelectedHotspot = (
    hotspot: ClassifiedHotspot | null
  ) => {

    setSelectedHotspotState(
      hotspot
    );


    if (
      typeof window !==
      'undefined'
    ) {

      if (hotspot) {

        localStorage.setItem(
          'vtx_selectedHotspot',
          hotspot.id
        );

      } else {

        localStorage.removeItem(
          'vtx_selectedHotspot'
        );
      }
    }
  };


  /*
   * =======================================================
   * MAP STYLE
   * =======================================================
   */

  const [
    mapStyle,
    setMapStyleState,
  ] = useState<string>(
    'Carto Dark Matter'
  );


  const setMapStyle = (
    style: string
  ) => {

    setMapStyleState(
      style
    );


    if (
      typeof window !==
      'undefined'
    ) {

      localStorage.setItem(
        'vtx_mapStyle',
        style
      );
    }
  };


  /*
   * =======================================================
   * STREAM FILTER
   * =======================================================
   */

  const [
    streamFilter,
    setStreamFilterState,
  ] = useState<string>(
    'ALL'
  );


  const setStreamFilter = (
    filter: string
  ) => {

    setStreamFilterState(
      filter
    );


    if (
      typeof window !==
      'undefined'
    ) {

      localStorage.setItem(
        'vtx_streamFilter',
        filter
      );
    }
  };


  /*
   * =======================================================
   * MAP CENTER
   * =======================================================
   */

  const [
    mapCenter,
    setMapCenterState,
  ] = useState<
    [number, number]
  >(INDIA_CENTER);


  const setMapCenter = (
    center: [number, number]
  ) => {

    setMapCenterState(
      center
    );


    if (
      typeof window !==
      'undefined'
    ) {

      localStorage.setItem(
        'vtx_mapCenter',
        JSON.stringify(center)
      );
    }
  };


  /*
   * =======================================================
   * MAP ZOOM
   * =======================================================
   */

  const [
    mapZoom,
    setMapZoomState,
  ] = useState<number>(
    INDIA_ZOOM
  );


  const setMapZoom = (
    zoom: number
  ) => {

    setMapZoomState(
      zoom
    );


    if (
      typeof window !==
      'undefined'
    ) {

      localStorage.setItem(
        'vtx_mapZoom',
        zoom.toString()
      );
    }
  };


  /*
   * =======================================================
   * RESTORE UI STATE
   * =======================================================
   */

  useEffect(() => {

    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }


    const savedStyle =
      localStorage.getItem(
        'vtx_mapStyle'
      );

    if (savedStyle) {

      setMapStyleState(
        savedStyle
      );
    }


    const savedFilter =
      localStorage.getItem(
        'vtx_streamFilter'
      );

    if (savedFilter) {

      setStreamFilterState(
        savedFilter
      );
    }


    const savedCenter =
      localStorage.getItem(
        'vtx_mapCenter'
      );

    if (savedCenter) {

      try {

        const parsed =
          JSON.parse(
            savedCenter
          );

        if (
          Array.isArray(parsed) &&
          parsed.length === 2 &&
          typeof parsed[0] ===
            'number' &&
          typeof parsed[1] ===
            'number'
        ) {

          setMapCenterState(
            parsed as [
              number,
              number
            ]
          );
        }

      } catch {
        // Ignore malformed map center.
      }
    }


    const savedZoom =
      localStorage.getItem(
        'vtx_mapZoom'
      );

    if (savedZoom) {

      const parsedZoom =
        parseFloat(
          savedZoom
        );

      if (
        Number.isFinite(
          parsedZoom
        )
      ) {

        setMapZoomState(
          parsedZoom
        );
      }
    }

  }, []);


  /*
   * =======================================================
   * FETCH ALL CURRENT FIRMS OBSERVATIONS
   * =======================================================
   *
   * FIRMS provides the live map stream.
   *
   * These objects begin as PENDING only because FIRMS itself
   * does not contain Gemini classification.
   *
   * refreshData() immediately reconciles them with the
   * backend classified stream.
   */

  const fetchAllCurrentMapHotspots =
    async (): Promise<
      ClassifiedHotspot[]
    > => {

      const response =
        await fetch(
          `${API_BASE_URL}/api/v1/firms/realtime?country=IND&days=1`,
          {
            cache: 'no-store',
          }
        );


      if (!response.ok) {

        throw new Error(
          `Failed to fetch current FIRMS observations (${response.status})`
        );
      }


      const geojson =
        await response.json();


      if (
        geojson?.type !==
          'FeatureCollection' ||
        !Array.isArray(
          geojson.features
        )
      ) {

        throw new Error(
          'Invalid FIRMS GeoJSON response'
        );
      }


      return geojson.features

        .map(
          (
            feature: any,
            index: number
          ) => {

            const props =
              feature?.properties ??
              {};

            const coordinates =
              feature?.geometry
                ?.coordinates ??
              [0, 0];


            const longitude =
              Number(
                coordinates[0]
              );

            const latitude =
              Number(
                coordinates[1]
              );


            if (
              !Number.isFinite(
                longitude
              ) ||
              !Number.isFinite(
                latitude
              )
            ) {

              return null;
            }


            const id =
              String(
                feature?.id ??
                props?.id ??
                `firms-${index}`
              );


            return {

              id,

              hotspot: {

                id:
                  props?.id ??
                  id,

                latitude,

                longitude,

                brightness:
                  props?.brightness ??
                  props?.bright_ti4 ??
                  0,

                scan:
                  props?.scan ??
                  0,

                track:
                  props?.track ??
                  0,

                acq_date:
                  props?.acq_date ??
                  '',

                acq_time:
                  props?.acq_time ??
                  '',

                satellite:
                  props?.satellite ??
                  '',

                instrument:
                  props?.instrument ??
                  '',

                confidence:
                  props?.confidence ??
                  'nominal',

                version:
                  props?.version ??
                  '',

                bright_t31:
                  props?.bright_t31 ??
                  props?.bright_ti5 ??
                  0,

                frp:
                  Number(
                    props?.frp ??
                    0
                  ),

                daynight:
                  props?.daynight ??
                  'D',
              },


              classification: {

                classification:
                  ClassificationType.UNCLASSIFIED,

                confidence_score:
                  0,

                explanation:
                  'Awaiting AI classification.',

                evidence: [],

                risk_score:
                  0,

                risk_level:
                  'LOW',
              },


              context: {

                nearby_facilities:
                  [],

                nearest_facility_distance:
                  null,

                nearest_facility_type:
                  null,

                facility_count_in_radius:
                  0,

                land_use_context:
                  [],

                osm_source:
                  'PENDING',

                queried_at:
                  null,
              },

            } as ClassifiedHotspot;
          }
        )

        .filter(
          (
            hotspot:
              ClassifiedHotspot | null
          ): hotspot is ClassifiedHotspot =>
            hotspot !== null
        );
    };


  /*
   * =======================================================
   * REFRESH DATA
   * =======================================================
   */

  const refreshData =
    async () => {

      try {

        setLoading(
          true
        );


        setError(
          null
        );


        /*
         * ---------------------------------------------------
         * 1. Fetch both streams
         * ---------------------------------------------------
         */

        const [
          initialClassifiedData,
          currentMapData,
        ] = await Promise.all([

          fetchClassifiedHotspots(
            'IND',
            1
          ),

          fetchAllCurrentMapHotspots(),

        ]);


        /*
         * ---------------------------------------------------
         * 2. Reconcile live FIRMS with backend state
         * ---------------------------------------------------
         */

        const mergedInitialMapData =
          mergeClassifiedIntoMap(
            currentMapData,
            initialClassifiedData
          );


        /*
         * ---------------------------------------------------
         * 3. Sidebar / classified stream
         * ---------------------------------------------------
         */

        setHotspots(
          initialClassifiedData
        );


        /*
         * ---------------------------------------------------
         * 4. Map stream
         * ---------------------------------------------------
         *
         * IMPORTANT:
         *
         * This is no longer just raw PENDING FIRMS data.
         *
         * It contains the backend classification whenever
         * the corresponding FIRMS observation has one.
         */

        setMapHotspots(
          mergedInitialMapData
        );


        setIsDemoMode(
          false
        );


        /*
         * ---------------------------------------------------
         * 5. Restore selected hotspot
         * ---------------------------------------------------
         */

        if (
          typeof window !==
          'undefined'
        ) {

          const savedId =
            localStorage.getItem(
              'vtx_selectedHotspot'
            );


          if (savedId) {

            const found =
              mergedInitialMapData.find(
                (
                  hotspot
                ) =>
                  hotspot.id ===
                  savedId
              );


            if (found) {

              setSelectedHotspotState(
                found
              );

            } else {

              const fallback =
                initialClassifiedData.find(
                  (
                    hotspot
                  ) =>
                    hotspot.id ===
                    savedId
                );


              setSelectedHotspotState(
                fallback || null
              );
            }
          }
        }


        /*
         * ---------------------------------------------------
         * 6. Background OSM enrichment
         * ---------------------------------------------------
         *
         * Backend enrichment runs separately so the dashboard
         * doesn't have to wait for every OSM request.
         *
         * When it finishes:
         *
         *   - refetch classified data
         *   - refetch live FIRMS
         *   - merge them again
         *   - update BOTH streams
         */

        void enrichTop50Hotspots(
          initialClassifiedData
        )

          .then(
            async () => {

              const enrichedData =
                await fetchClassifiedHotspots(
                  'IND',
                  1
                );


              setHotspots(
                enrichedData
              );


              /*
               * Refetch current FIRMS so map state remains
               * synchronized with the backend.
               */

              const freshMapData =
                await fetchAllCurrentMapHotspots();


              const mergedEnrichedMapData =
                mergeClassifiedIntoMap(
                  freshMapData,
                  enrichedData
                );


              setMapHotspots(
                mergedEnrichedMapData
              );


              /*
               * Keep the selected hotspot synchronized with
               * the newly enriched backend object.
               */

              if (
                typeof window !==
                'undefined'
              ) {

                const savedId =
                  localStorage.getItem(
                    'vtx_selectedHotspot'
                  );


                if (savedId) {

                  const found =
                    mergedEnrichedMapData.find(
                      (
                        hotspot
                      ) =>
                        hotspot.id ===
                        savedId
                    );


                  if (found) {

                    setSelectedHotspotState(
                      found
                    );

                  }
                }
              }

            }
          )

          .catch(
            (
              enrichmentError
            ) => {

              console.warn(
                '[VERTEX] Background OSM enrichment failed:',
                enrichmentError
              );
            }
          );


        /*
         * ---------------------------------------------------
         * 7. Analytics
         * ---------------------------------------------------
         */

        const summary =
          await fetchAnalyticsSummary();


        setAnalyticsSummary(
          summary
        );


        setIsDemoMode(
          false
        );


      } catch (
        err: any
      ) {

        console.warn(
          'Database connection failed. Falling back to offline demo cache.',
          err
        );


        setHotspots(
          DEMO_HOTSPOTS
        );


        setMapHotspots(
          DEMO_HOTSPOTS
        );


        setAnalyticsSummary(
          generateDemoSummary(
            DEMO_HOTSPOTS
          )
        );


        setIsDemoMode(
          true
        );


        setError(
          err?.message ||
          'Unable to connect to live backend.'
        );


        /*
         * Restore demo selection.
         */

        if (
          typeof window !==
          'undefined'
        ) {

          const savedId =
            localStorage.getItem(
              'vtx_selectedHotspot'
            );


          if (savedId) {

            const found =
              DEMO_HOTSPOTS.find(
                (
                  hotspot
                ) =>
                  hotspot.id ===
                  savedId
              );


            setSelectedHotspotState(
              found || null
            );
          }
        }

      } finally {

        setLoading(
          false
        );
      }
    };


  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {

    refreshData();

  }, []);


  /*
   * =======================================================
   * PROVIDER
   * =======================================================
   */

  return (
    <GlobalStateContext.Provider
      value={{

        hotspots,

        mapHotspots,

        analyticsSummary,

        loading,

        error,

        isDemoMode,

        selectedHotspot,

        setSelectedHotspot,

        mapStyle,

        setMapStyle,

        streamFilter,

        setStreamFilter,

        mapCenter,

        setMapCenter,

        mapZoom,

        setMapZoom,

        refreshData,

      }}
    >

      {children}

    </GlobalStateContext.Provider>
  );
}


/*
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useGlobalState() {

  const context =
    useContext(
      GlobalStateContext
    );


  if (
    context === undefined
  ) {

    throw new Error(
      'useGlobalState must be used within a GlobalStateProvider'
    );
  }


  return context;
}