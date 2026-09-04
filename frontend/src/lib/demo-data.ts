import { ClassifiedHotspot, ClassificationType } from '@/types';

export const DEMO_HOTSPOTS: ClassifiedHotspot[] = [
  {
    id: "vtx-613",
    hotspot: {
      id: "firms-613",
      latitude: 11.8898,
      longitude: 77.2143,
      brightness: 335.6,
      scan: 1.0,
      track: 1.0,
      acq_date: "2026-08-30",
      acq_time: "0830",
      satellite: "N20",
      instrument: "VIIRS",
      confidence: "nominal",
      version: "2.0",
      bright_t31: 295.2,
      frp: 61.3,
      daynight: "D"
    },
    classification: {
      classification: ClassificationType.WILDFIRE_FOREST_FIRE,
      confidence_score: 0.75,
      explanation: "High Fire Radiative Power (61.3 MW) detected during daytime with zero industrial facilities within 5km. The coordinates locate to a forested and hilly region in Southern India (Sathyamangalam region), where intense thermal anomalies typically represent forest fires.",
      evidence: [
        "High FRP of 61.3 MW indicates a high-intensity vegetation fire",
        "Zero industrial facilities identified within 5 km radius",
        "Location corresponds to forested/hilly terrain"
      ],
      risk_score: 85.0,
      risk_level: "HIGH"
    },
    context: {
      nearby_facilities: [],
      nearest_facility_distance: null,
      nearest_facility_type: null,
      facility_count_in_radius: 0,
      land_use_context: ["forest", "hill"],
      osm_source: "CACHED"
    }
  },
  {
    id: "vtx-38",
    hotspot: {
      id: "firms-38",
      latitude: 23.4121,
      longitude: 85.3121,
      brightness: 350.1,
      scan: 1.0,
      track: 1.0,
      acq_date: "2026-08-30",
      acq_time: "1015",
      satellite: "N20",
      instrument: "VIIRS",
      confidence: "high",
      version: "2.0",
      bright_t31: 298.1,
      frp: 120.4,
      daynight: "N"
    },
    classification: {
      classification: ClassificationType.INDUSTRIAL_FIRE,
      confidence_score: 0.92,
      explanation: "Extremely high thermal signature consistent with an industrial incident. Nighttime detection eliminates solar reflection. Proximity to Tata Steel facility (800m) suggests structural involvement.",
      evidence: [
        "FRP of 120.4 MW is extremely high for this region",
        "Nighttime detection confirms persistent thermal source",
        "Located 800m from known heavy industrial zone (Tata Steel)"
      ],
      risk_score: 95.0,
      risk_level: "CRITICAL"
    },
    context: {
      nearby_facilities: [
        { name: "Tata Steel Jamshedpur Works", type: "Heavy Industry", distance_m: 800 }
      ],
      nearest_facility_distance: 800,
      nearest_facility_type: "Heavy Industry",
      facility_count_in_radius: 3,
      land_use_context: ["industrial", "urban"],
      osm_source: "CACHED"
    }
  },
  {
    id: "vtx-21",
    hotspot: {
      id: "firms-21",
      latitude: 28.5231,
      longitude: 76.8123,
      brightness: 310.4,
      scan: 1.0,
      track: 1.0,
      acq_date: "2026-08-30",
      acq_time: "1420",
      satellite: "Aqua",
      instrument: "MODIS",
      confidence: "nominal",
      version: "2.0",
      bright_t31: 290.0,
      frp: 15.2,
      daynight: "D"
    },
    classification: {
      classification: ClassificationType.AGRICULTURAL_BURN,
      confidence_score: 0.88,
      explanation: "Low-intensity thermal anomaly detected during harvest season in agricultural region (Haryana). Typical signature of stubble burning.",
      evidence: [
        "Low FRP (15.2 MW) typical of agricultural fires",
        "Located in known agricultural plain",
        "Daytime detection matches burn schedules"
      ],
      risk_score: 40.0,
      risk_level: "LOW"
    },
    context: {
      nearby_facilities: [],
      nearest_facility_distance: null,
      nearest_facility_type: null,
      facility_count_in_radius: 0,
      land_use_context: ["farmland"],
      osm_source: "CACHED"
    }
  },
  {
    id: "vtx-99",
    hotspot: {
      id: "firms-99",
      latitude: 21.1938,
      longitude: 72.8302,
      brightness: 345.2,
      scan: 1.0,
      track: 1.0,
      acq_date: "2026-08-30",
      acq_time: "2200",
      satellite: "N20",
      instrument: "VIIRS",
      confidence: "high",
      version: "2.0",
      bright_t31: 300.1,
      frp: 45.8,
      daynight: "N"
    },
    classification: {
      classification: ClassificationType.GAS_FLARE,
      confidence_score: 0.95,
      explanation: "Highly persistent nighttime thermal anomaly located exactly at Reliance Industries Hazira Manufacturing Division. Signature matches industrial gas flaring.",
      evidence: [
        "Exact coordinate match with known petroleum refinery",
        "Persistent nighttime signature",
        "Stable FRP characteristics (45.8 MW) consistent with stack flaring"
      ],
      risk_score: 25.0,
      risk_level: "LOW"
    },
    context: {
      nearby_facilities: [
        { name: "Reliance Industries Hazira", type: "Petroleum Refinery", distance_m: 120 }
      ],
      nearest_facility_distance: 120,
      nearest_facility_type: "Petroleum Refinery",
      facility_count_in_radius: 5,
      land_use_context: ["industrial"],
      osm_source: "CACHED"
    }
  }
];

export function generateDemoSummary(hotspots: ClassifiedHotspot[]) {
  const counts: Record<string, number> = {};
  const risks: Record<string, number> = {};
  const frps: number[] = [];
  const facilities: Record<string, {name: string, type: string, count: number}> = {};

  hotspots.forEach(h => {
    const c = h.classification.classification || 'UNCLASSIFIED';
    const r = h.classification.risk_level || 'LOW';
    counts[c] = (counts[c] || 0) + 1;
    risks[r] = (risks[r] || 0) + 1;
    frps.push(h.hotspot.frp);

    if (h.context.nearby_facilities && h.context.nearby_facilities.length > 0) {
      const fac = h.context.nearby_facilities[0];
      if (!facilities[fac.name]) {
        facilities[fac.name] = { name: fac.name, type: fac.type, count: 0 };
      }
      facilities[fac.name].count++;
    }
  });

  const industrialEvents = hotspots.filter(h => 
    h.classification.classification === ClassificationType.INDUSTRIAL_FIRE || 
    h.classification.classification === ClassificationType.GAS_FLARE ||
    h.classification.classification === ClassificationType.PERSISTENT_INDUSTRIAL_SOURCE
  ).length;

  const topFacs = Object.values(facilities).sort((a, b) => b.count - a.count).slice(0, 5);

  const frpDist = [
    { range: '0-20', count: frps.filter(f => f <= 20).length },
    { range: '20-50', count: frps.filter(f => f > 20 && f <= 50).length },
    { range: '50-100', count: frps.filter(f => f > 50 && f <= 100).length },
    { range: '100+', count: frps.filter(f => f > 100).length }
  ];

  return {
    totalDetections: hotspots.length,
    industrialEvents,
    highRisk: hotspots.filter(h => h.classification.risk_level === 'HIGH' || h.classification.risk_level === 'CRITICAL').length,
    averageFrp: frps.length > 0 ? frps.reduce((a,b) => a+b, 0) / frps.length : 0,
    classificationDistribution: Object.entries(counts).map(([type, count]) => ({ type, count })),
    riskDistribution: Object.entries(risks).map(([level, count]) => ({ level, count })),
    frpDistribution: frpDist,
    topFacilities: topFacs
  };
}

