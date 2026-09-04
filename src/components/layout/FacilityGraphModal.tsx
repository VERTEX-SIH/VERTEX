'use client';
import { ClassifiedHotspot } from '@/types';

interface FacilityGraphModalProps {
  hotspot: ClassifiedHotspot;
  onClose: () => void;
}

export function FacilityGraphModal({ hotspot, onClose }: FacilityGraphModalProps) {
  const fac = hotspot.context.nearby_facilities?.[0];
  
  if (!fac) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-surface/95 backdrop-blur-md">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6">
          <div>
            <h1 className="font-headline-sm text-2xl text-primary uppercase tracking-widest">FACILITY GRAPH</h1>
            <p className="font-mono text-[10px] text-secondary uppercase tracking-widest mt-1">ASSET CONTEXT TREE</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors flex items-center gap-2 border border-outline-variant px-4 py-2 bg-surface-container-low">
            <span className="font-mono-label text-[11px] tracking-widest">CLOSE VIEW</span>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          {/* Mock visual tree */}
          <div className="max-w-3xl w-full flex flex-col items-center">
            
            <div className="border border-primary bg-surface-container-low p-6 text-center shadow-lg relative w-full max-w-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <span className="material-symbols-outlined text-4xl text-primary mb-2">factory</span>
              <h2 className="font-headline-sm text-[18px] text-on-surface uppercase">{fac.name}</h2>
              <div className="font-mono text-[11px] text-secondary tracking-widest mt-1">{fac.type}</div>
              <div className="mt-4 inline-block bg-surface border border-outline-variant px-3 py-1 font-mono-data-sm text-[12px] text-primary">
                DISTANCE: {fac.distance_m.toFixed(0)}m
              </div>
            </div>

            <div className="h-12 w-px bg-outline-variant"></div>

            <div className="flex gap-12 w-full justify-center relative">
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-outline-variant"></div>
              
              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-outline-variant"></div>
                <div className="border border-outline-variant bg-surface p-4 text-center w-40 hover:border-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-secondary mb-2">local_fire_department</span>
                  <div className="font-headline-sm text-[12px] uppercase">Flare Stack A</div>
                  <div className="font-mono text-[9px] text-secondary mt-1">UNIT-01</div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-outline-variant"></div>
                <div className="border border-primary bg-surface-container p-4 text-center w-40 shadow-[0_0_15px_rgba(161,64,0,0.15)] cursor-pointer">
                  <span className="material-symbols-outlined text-primary mb-2 animate-pulse">warning</span>
                  <div className="font-headline-sm text-[12px] uppercase">Processing Unit</div>
                  <div className="font-mono text-[9px] text-secondary mt-1">ANOMALY DETECTED</div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-6 w-px bg-outline-variant"></div>
                <div className="border border-outline-variant bg-surface p-4 text-center w-40 hover:border-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-secondary mb-2">propane_tank</span>
                  <div className="font-headline-sm text-[12px] uppercase">Storage Tanks</div>
                  <div className="font-mono text-[9px] text-secondary mt-1">CAPACITY 80%</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

