'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ClassifiedHotspot,
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
} from '@/types';

interface EvidenceStackModalProps {
  hotspot: ClassifiedHotspot;
  onClose: () => void;
  satelliteEvidence?: any;
}

export function EvidenceStackModal({
  hotspot,
  onClose,
  satelliteEvidence,
}: EvidenceStackModalProps) {
  const router = useRouter();
  const { hotspot: firms, classification, context } = hotspot;
  const color = CLASSIFICATION_COLORS[classification.classification];
  const label = CLASSIFICATION_LABELS[classification.classification];
  const [showSatelliteImage, setShowSatelliteImage] = useState(false);

  return (
    <div className="fixed top-[40px] right-0 bottom-0 left-0 z-[40] flex flex-col bg-surface/95 backdrop-blur-md">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between border border-outline-variant bg-surface px-3 py-2">
            <div className="font-mono text-[9px] text-secondary uppercase tracking-widest">
              EVENT {String(hotspot.id)} · EVIDENCE REVIEW
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="font-mono-label text-[10px] text-secondary hover:text-primary uppercase tracking-widest px-2 py-1 border border-outline-variant"
              >
                HOME
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/analytics');
                }}
                className="font-mono-label text-[10px] text-secondary hover:text-primary uppercase tracking-widest px-2 py-1 border border-outline-variant"
              >
                ANALYTICS
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-mono-label text-[10px] text-secondary hover:text-primary uppercase tracking-widest px-2 py-1 border border-outline-variant"
              >
                RETURN
              </button>
            </div>
          </div>

          <section className="bg-surface border border-outline-variant p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4 border-b border-outline-variant pb-2 mb-4">
              <div>
                <div className="font-headline-sm text-[16px] text-primary uppercase">
                  EVIDENCE STACK
                </div>
                <div className="font-mono text-[10px] text-secondary tracking-widest mt-1">
                  MULTI-SOURCE EVENT ANALYSIS
                </div>
              </div>
              <div
                className="font-headline-sm text-[14px] uppercase"
                style={{ color }}
              >
                {label}
              </div>
            </div>

            {satelliteEvidence?.image_data_url && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono-label text-[10px] text-secondary tracking-widest uppercase">
                    SATELLITE EVIDENCE
                  </div>
                  <div className="font-mono text-[9px] text-secondary uppercase tracking-widest">
                    SENTINEL-2 L2A · COPERNICUS CDSE
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSatelliteImage(true)}
                  className="block w-full cursor-zoom-in border border-outline-variant bg-black"
                  title="Open satellite image"
                >
                  <img
                    src={satelliteEvidence.image_data_url}
                    alt="Sentinel-2 satellite context around hotspot"
                    className="w-full max-h-[58vh] object-contain"
                  />
                </button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-outline-variant border border-outline-variant mt-2">
                  <div className="bg-surface p-2">
                    <div className="font-mono-label text-[9px] text-secondary">
                      SOURCE
                    </div>
                    <div className="font-mono-data-sm text-[11px] text-on-surface mt-1">
                      Copernicus CDSE
                    </div>
                  </div>
                  <div className="bg-surface p-2">
                    <div className="font-mono-label text-[9px] text-secondary">
                      PRODUCT
                    </div>
                    <div className="font-mono-data-sm text-[11px] text-on-surface mt-1">
                      Sentinel-2 L2A
                    </div>
                  </div>
                  <div className="bg-surface p-2">
                    <div className="font-mono-label text-[9px] text-secondary">
                      TYPE
                    </div>
                    <div className="font-mono-data-sm text-[11px] text-on-surface mt-1">
                      True colour
                    </div>
                  </div>
                  <div className="bg-surface p-2">
                    <div className="font-mono-label text-[9px] text-secondary">
                      HOTSPOT
                    </div>
                    <div className="font-mono-data-sm text-[11px] text-on-surface mt-1">
                      {firms.latitude.toFixed(4)}, {firms.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="font-body-sm text-[10px] text-secondary mt-2">
                  Visual contextual evidence around the FIRMS detection; not thermal ground truth.
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono-label text-[10px] text-secondary tracking-widest mb-2 border-b border-outline-variant pb-1">
                  TELEMETRY DATA
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-3 font-mono-data-sm text-[12px] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-secondary">FRP</span>
                    <span className="text-primary">{firms.frp.toFixed(1)} MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">BRIGHTNESS</span>
                    <span className="text-on-surface">{firms.brightness.toFixed(1)} K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">CONFIDENCE</span>
                    <span className="text-on-surface">{classification.confidence_score.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">INSTRUMENT</span>
                    <span className="text-on-surface">{firms.satellite} / {firms.instrument}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">LATITUDE</span>
                    <span className="text-on-surface">{firms.latitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">LONGITUDE</span>
                    <span className="text-on-surface">{firms.longitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">TIME (UTC)</span>
                    <span className="text-on-surface">{firms.acq_date} {firms.acq_time}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono-label text-[10px] text-secondary tracking-widest mb-2 border-b border-outline-variant pb-1">
                  AI CLASSIFICATION
                </div>
                <div
                  className="font-headline-sm text-[16px] p-2 border bg-surface uppercase"
                  style={{ color, borderColor: color }}
                >
                  {label}
                </div>
                <div className="mt-3 bg-surface-container-low border border-outline-variant p-3 font-body-sm text-[12px] leading-relaxed">
                  {classification.explanation}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-outline-variant p-6 shadow-sm">
            <h2 className="font-headline-sm text-[16px] text-primary uppercase border-b border-outline-variant pb-2 mb-4">
              SUPPORTING EVIDENCE
            </h2>

            {classification.evidence && classification.evidence.length > 0 ? (
              <ul className="space-y-2">
                {classification.evidence.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 bg-surface-container-low p-3 border border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">
                      check_circle
                    </span>
                    <span className="font-body-sm text-[13px]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="font-body-sm text-secondary p-3 border border-outline-variant">
                No additional textual evidence recorded.
              </div>
            )}
          </section>

          <section className="bg-surface border border-outline-variant p-6 shadow-sm">
            <h2 className="font-headline-sm text-[16px] text-primary uppercase border-b border-outline-variant pb-2 mb-4">
              PROXIMITY & CONTEXT
            </h2>

            {context.nearby_facilities && context.nearby_facilities.length > 0 ? (
              <div className="space-y-4">
                {context.nearby_facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border border-outline-variant p-4 bg-surface-container-low"
                  >
                    <div>
                      <div className="font-headline-sm text-[14px] text-on-surface uppercase">
                        {fac.name}
                      </div>
                      <div className="font-mono text-[11px] text-secondary mt-1">
                        {fac.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-data-md text-primary text-[16px]">
                        {Number(fac.distance_m ?? fac.distance_meters ?? 0).toFixed(0)}m
                      </div>
                      <div className="font-mono text-[9px] text-secondary uppercase">
                        DISTANCE
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-secondary font-body-sm p-4 border border-outline-variant bg-surface-container-low text-center italic">
                No recognized industrial facilities within 5km radius.
              </div>
            )}

            <div className="mt-6 border-t border-outline-variant pt-4">
              <div className="font-mono-label text-[10px] text-secondary tracking-widest mb-2">
                SYSTEM LOG
              </div>
              <div className="bg-black p-4 font-mono text-[10px] text-green-400 min-h-32 max-h-48 overflow-y-auto whitespace-pre">
{`[SYS] Initializing classification pipeline...
[SYS] Fetched coordinates ${firms.latitude}, ${firms.longitude}
[OSM] Queried radius 5000m. Found ${context.facility_count_in_radius} facilities.
[AI]  Invoking model VERTEX-CLF-1.0
[AI]  Payload: FRP ${firms.frp}, DAYNIGHT ${firms.daynight}
[AI]  Response: ${classification.classification} (Conf: ${classification.confidence_score})
[DB]  Status: CACHED_DEMO
[SYS] Pipeline complete.`}
              </div>
            </div>
          </section>
        </div>
      </div>

      {showSatelliteImage && satelliteEvidence?.image_data_url && (
        <div
          className="fixed top-[40px] right-0 bottom-0 left-0 z-[90] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowSatelliteImage(false)}
        >
          <div
            className="relative max-w-7xl max-h-[92vh] w-full flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border border-outline-variant bg-surface px-3 py-2">
              <div>
                <div className="font-headline-sm text-[12px] text-primary uppercase tracking-widest">
                  EXPANDED SATELLITE EVIDENCE
                </div>
                <div className="font-mono text-[9px] text-secondary mt-1 uppercase tracking-widest">
                  SENTINEL-2 L2A · COPERNICUS CDSE · EVENT {hotspot.id}
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
                src={satelliteEvidence.image_data_url}
                alt="Expanded Sentinel-2 satellite context around hotspot"
                className="max-w-full max-h-[78vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
