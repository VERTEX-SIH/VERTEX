'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useGlobalState } from '@/lib/GlobalStateContext';
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  ClassificationType,
} from '@/types';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const {
    analyticsSummary: summary,
    hotspots,
    mapHotspots,
    loading,
    error,
  } = useGlobalState();

  /*
   * =========================================================
   * LIVE ANALYTICS
   * =========================================================
   *
   * Current FIRMS observations are the authoritative population.
   * The stored classified stream is merged onto those observations
   * by FIRMS identity. Backend summary values are not used for the
   * headline numbers/charts because they can lag the live feed.
   */

  const classifiedHotspots = Array.isArray(hotspots)
    ? hotspots
    : [];

  const firmsObservations = Array.isArray(mapHotspots)
    ? mapHotspots
    : [];

  const hotspotIdentity = (hotspot: any) => {
    const source = hotspot?.hotspot ?? hotspot;
    const latitude = Number(source?.latitude);
    const longitude = Number(source?.longitude);
    const acqDate = String(source?.acq_date ?? '');
    const acqTime = String(source?.acq_time ?? '').padStart(4, '0');
    const satellite = String(source?.satellite ?? '');

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return '';
    }

    return `${latitude.toFixed(5)}|${longitude.toFixed(5)}|${acqDate}|${acqTime}|${satellite}`;
  };

  const classifiedIndex = new Map<string, any>();

  classifiedHotspots.forEach((hotspot: any) => {
    const key = hotspotIdentity(hotspot);

    if (key) {
      classifiedIndex.set(key, hotspot);
    }
  });

  /*
   * Normally mapHotspots contains the complete current FIRMS feed.
   * During a transient provider state, fall back to the classified
   * current stream instead of displaying false zeros.
   */
  const liveObservations =
    firmsObservations.length > 0
      ? firmsObservations.map((observation: any) => {
          const match = classifiedIndex.get(
            hotspotIdentity(observation)
          );

          if (!match) {
            return observation;
          }

          return {
            ...observation,
            id: match.id,
            hotspot: {
              ...observation.hotspot,
              ...match.hotspot,
            },
            classification: match.classification,
            context: match.context,
          };
        })
      : classifiedHotspots;

  const isClassified = (hotspot: any) => {
    const type = String(
      hotspot?.classification?.classification ?? ''
    ).toUpperCase();

    return (
      type.length > 0 &&
      type !== String(
        ClassificationType.UNCLASSIFIED
      ).toUpperCase()
    );
  };

  const liveClassifiedHotspots =
    liveObservations.filter(isClassified);

  const totalFirmsObservations =
    liveObservations.length;

  const aiClassified =
    liveClassifiedHotspots.length;

  const aiPending =
    Math.max(
      totalFirmsObservations - aiClassified,
      0
    );

  const frpValues = liveObservations
    .map((hotspot: any) =>
      Number(
        hotspot?.hotspot?.frp ??
        hotspot?.frp ??
        0
      )
    )
    .filter((value: number) =>
      Number.isFinite(value)
    );

  const averageFrp = frpValues.length
    ? frpValues.reduce(
        (sum: number, value: number) =>
          sum + value,
        0
      ) / frpValues.length
    : 0;

  const classificationCounts: Record<
    string,
    number
  > = {};

  liveClassifiedHotspots.forEach(
    (hotspot: any) => {
      const type =
        String(
          hotspot?.classification?.classification ??
            ClassificationType.UNKNOWN_UNCERTAIN
        );

      classificationCounts[type] =
        (classificationCounts[type] || 0) + 1;
    }
  );

  const riskCounts: Record<
    string,
    number
  > = {};

  liveClassifiedHotspots.forEach(
    (hotspot: any) => {
      const level =
        String(
          hotspot?.classification?.risk_level ??
            'UNKNOWN'
        ).toUpperCase();

      riskCounts[level] =
        (riskCounts[level] || 0) + 1;
    }
  );

  const industrialTypes = new Set([
    'INDUSTRIAL_FIRE',
    'GAS_FLARE',
    'PERSISTENT_INDUSTRIAL_SOURCE',
  ]);

  const industrialEvents =
    Object.entries(classificationCounts)
      .filter(([type]) =>
        industrialTypes.has(type)
      )
      .reduce(
        (sum, [, count]) =>
          sum + count,
        0
      );

  const highRisk =
    (riskCounts.HIGH || 0) +
    (riskCounts.CRITICAL || 0);

  const pieData =
    Object.entries(classificationCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        name:
          CLASSIFICATION_LABELS[
            type as ClassificationType
          ] || type,
        value: count,
        color:
          CLASSIFICATION_COLORS[
            type as ClassificationType
          ] ||
          CLASSIFICATION_COLORS[
            ClassificationType.UNKNOWN_UNCERTAIN
          ],
      }));

  const frpBuckets = [
    {
      range: '0–5',
      min: 0,
      max: 5,
    },
    {
      range: '5–10',
      min: 5,
      max: 10,
    },
    {
      range: '10–25',
      min: 10,
      max: 25,
    },
    {
      range: '25–50',
      min: 25,
      max: 50,
    },
    {
      range: '50+',
      min: 50,
      max: Infinity,
    },
  ];

  const frpDistribution =
    frpBuckets.map(
      ({
        range,
        min,
        max,
      }) => ({
        range,
        count:
          frpValues.filter(
            (value) =>
              value >= min &&
              value < max
          ).length,
      })
    );

  const facilityMap: Record<
    string,
    {
      name: string;
      type: string;
      count: number;
    }
  > = {};

  liveClassifiedHotspots.forEach(
    (hotspot: any) => {
      const context =
        hotspot?.context ||
        hotspot?.osm_context ||
        {};

      const facilities =
        Array.isArray(
          context?.nearby_facilities
        )
          ? context.nearby_facilities
          : [];

      facilities.forEach(
        (facility: any) => {
          const name =
            facility?.name ||
            facility?.tags?.name ||
            'UNNAMED FACILITY';

          const type =
            facility?.type ||
            facility?.tags?.industrial ||
            facility?.tags?.amenity ||
            'UNKNOWN';

          const key = `${name}|${type}`;

          if (!facilityMap[key]) {
            facilityMap[key] = {
              name,
              type: String(
                type
              ).replace(
                /_/g,
                ' '
              ),
              count: 0,
            };
          }

          facilityMap[key].count += 1;
        }
      );
    }
  );

  const topFacilities =
    Object.values(facilityMap)
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 10);

  const riskOrder = [
    'CRITICAL',
    'HIGH',
    'MODERATE',
    'LOW',
    'UNKNOWN',
  ];

  const riskDistribution =
    riskOrder
      .filter(
        (level) =>
          riskCounts[level] !==
          undefined
      )
      .map((level) => ({
        level,
        count:
          riskCounts[level] || 0,
      }));

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex-1 min-h-0 bg-surface-dim text-on-surface flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">
              sync
            </span>

            <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">
              LOADING ANALYTICS
            </span>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (
    error &&
    !summary &&
    classifiedHotspots.length === 0
  ) {
    return (
      <div className="flex-1 min-h-0 bg-surface-dim text-on-surface flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center bg-surface border border-error p-8 max-w-md text-center">
            <span className="material-symbols-outlined text-4xl text-error mb-4">
              database
            </span>

            <span className="font-headline-sm text-[14px] text-error uppercase tracking-widest mb-2">
              SYSTEM ERROR
            </span>

            <p className="font-body-sm text-secondary">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div className="bg-surface-dim flex-1 min-h-0 text-on-surface overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        
{/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="border-b border-outline-variant pb-4 mb-6">
          <h1 className="font-headline-sm text-2xl text-primary uppercase tracking-widest">
            ANALYTICS
          </h1>

          <p className="font-body-sm text-secondary uppercase tracking-widest mt-1 text-xs">
            CURRENT FIRMS THERMAL EVENT ANALYSIS
          </p>
        </div>

        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              TOTAL FIRMS OBSERVATIONS
            </div>

            <div className="font-mono-data-md text-3xl text-on-surface">
              {totalFirmsObservations}
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              AI CLASSIFIED
            </div>

            <div className="font-mono-data-md text-3xl text-primary">
              {aiClassified}
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              AI PENDING
            </div>

            <div className="font-mono-data-md text-3xl text-error">
              {aiPending}
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              AVERAGE FRP (MW)
            </div>

            <div className="font-mono-data-md text-3xl text-on-surface">
              {Number(averageFrp || 0).toFixed(1)}
            </div>
          </div>

        </div>

        {/* =================================================
            OPERATIONAL SUMMARY
            ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              INDUSTRIAL / PERSISTENT EVENTS
            </div>

            <div className="font-mono-data-md text-2xl text-primary">
              {industrialEvents}
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-4">
            <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-2">
              HIGH / CRITICAL RISK
            </div>

            <div className="font-mono-data-md text-2xl text-error">
              {highRisk}
            </div>
          </div>

        </div>

        {/* =================================================
            CHART ROW 1
            ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Classification */}

          <div className="bg-surface border border-outline-variant p-4 flex flex-col h-[400px]">

            <div className="font-headline-sm text-[14px] text-primary uppercase mb-4">
              CLASSIFICATION DISTRIBUTION
            </div>

            <div className="flex-1 min-h-0">

              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">
                    NO CLASSIFICATION DATA
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>

                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        )
                      )}
                    </Pie>

                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1e1e1e',
                        borderColor: '#333333',
                        borderRadius: '0',
                        fontFamily: 'JetBrains Mono',
                      }}
                      itemStyle={{
                        color: '#e0e0e0',
                        fontSize: '12px',
                      }}
                    />

                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: '10px',
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>
              )}

            </div>
          </div>

          {/* FRP */}

          <div className="bg-surface border border-outline-variant p-4 flex flex-col h-[400px]">

            <div className="font-headline-sm text-[14px] text-primary uppercase mb-4">
              FRP DISTRIBUTION (MW)
            </div>

            <div className="flex-1 min-h-0">

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frpDistribution}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333333"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="range"
                    stroke="#888888"
                    tick={{
                      fill: '#888888',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#888888"
                    tick={{
                      fill: '#888888',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />

                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      borderColor: '#333333',
                      borderRadius: '0',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />

                  <Bar
                    dataKey="count"
                    fill="#a14000"
                    radius={[2, 2, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>
          </div>

        </div>

        {/* =================================================
            CHART ROW 2
            ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Risk */}

          <div className="bg-surface border border-outline-variant p-4 flex flex-col h-[300px]">

            <div className="font-headline-sm text-[14px] text-primary uppercase mb-4">
              RISK LEVEL DISTRIBUTION
            </div>

            <div className="flex-1 min-h-0">

              {riskDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">
                    NO RISK DATA
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskDistribution}
                    layout="vertical"
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#333333"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="#888888"
                      tick={{
                        fill: '#888888',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    <YAxis
                      dataKey="level"
                      type="category"
                      stroke="#888888"
                      width={80}
                      tick={{
                        fill: '#888888',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1e1e1e',
                        borderColor: '#333333',
                        borderRadius: '0',
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    <Bar
                      dataKey="count"
                      fill="#ea580c"
                      radius={[0, 2, 2, 0]}
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}

            </div>
          </div>

          {/* Facilities */}

          <div className="bg-surface border border-outline-variant p-4 flex flex-col h-[300px] overflow-hidden">

            <div className="font-headline-sm text-[14px] text-primary uppercase mb-4">
              TOP FACILITIES BY THERMAL ACTIVITY
            </div>

            <div className="flex-1 overflow-auto">

              <table className="w-full text-left border-collapse">

                <thead className="sticky top-0 bg-surface">

                  <tr>

                    <th className="font-mono-label text-[10px] text-secondary tracking-widest border-b border-outline-variant pb-2">
                      FACILITY NAME
                    </th>

                    <th className="font-mono-label text-[10px] text-secondary tracking-widest border-b border-outline-variant pb-2">
                      TYPE
                    </th>

                    <th className="font-mono-label text-[10px] text-secondary tracking-widest border-b border-outline-variant pb-2 text-right">
                      EVENTS
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {topFacilities.map(
                    (facility, index) => (
                      <tr
                        key={`${facility.name}-${facility.type}-${index}`}
                        className="hover:bg-surface-container-high transition-colors"
                      >

                        <td className="font-body-sm text-[12px] py-2 border-b border-outline-variant">
                          {facility.name}
                        </td>

                        <td className="font-body-sm text-[12px] py-2 border-b border-outline-variant text-secondary capitalize">
                          {facility.type}
                        </td>

                        <td className="font-mono-data-sm text-[12px] py-2 border-b border-outline-variant text-right text-primary">
                          {facility.count}
                        </td>

                      </tr>
                    )
                  )}

                  {topFacilities.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-4 font-mono text-[10px] text-secondary uppercase tracking-widest"
                      >
                        NO FACILITY DATA AVAILABLE
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}