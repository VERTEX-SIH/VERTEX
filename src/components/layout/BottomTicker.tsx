'use client';

import {
  ClassifiedHotspot,
  ClassificationType,
} from '@/types';
import { useGlobalState } from '@/lib/GlobalStateContext';

interface BottomTickerProps {
  hotspots?: ClassifiedHotspot[];
}

export function BottomTicker({ hotspots = [] }: BottomTickerProps) {
  const { isDemoMode } = useGlobalState();

  /*
   * VERTEX operational ticker categories.
   *
   * Keep these in a fixed order so the ticker remains stable
   * even when one category has zero detections.
   */
  const counts = {
    IND_FIRE: 0,
    IND_PERSIST: 0,
    WILD_FIRE: 0,
    AGRI_BURN: 0,
    UNCORROB: 0,
  };

  hotspots.forEach((hotspot) => {
    const classification =
      hotspot.classification?.classification;

    switch (classification) {
      case ClassificationType.INDUSTRIAL_FIRE:
        counts.IND_FIRE += 1;
        break;

      case ClassificationType.PERSISTENT_INDUSTRIAL_SOURCE:
        counts.IND_PERSIST += 1;
        break;

      case ClassificationType.WILDFIRE_FOREST_FIRE:
        counts.WILD_FIRE += 1;
        break;

      case ClassificationType.AGRICULTURAL_BURN:
        counts.AGRI_BURN += 1;
        break;

      case ClassificationType.UNKNOWN_UNCERTAIN:
      default:
        counts.UNCORROB += 1;
        break;
    }
  });

  const statsString = [
    `IND_FIRE: ${String(counts.IND_FIRE).padStart(2, '0')}`,
    `IND_PERSIST: ${String(counts.IND_PERSIST).padStart(2, '0')}`,
    `WILD_FIRE: ${String(counts.WILD_FIRE).padStart(2, '0')}`,
    `AGRI_BURN: ${String(counts.AGRI_BURN).padStart(2, '0')}`,
    `UNCORROB: ${String(counts.UNCORROB).padStart(2, '0')}`,
  ].join('  |  ');

  return (
    <footer className="bg-inverse-surface h-[32px] w-full flex items-center border-t border-outline fixed bottom-0 left-0 z-50 px-4 justify-between overflow-hidden">

      {/* Platform identity */}
      <div className="font-mono text-[10px] font-bold text-inverse-primary tracking-widest uppercase flex space-x-6 shrink-0">
        <span>VERTEX PLATFORM v1.0</span>
        <span>THERMAL INTELLIGENCE</span>
      </div>

      {/* Live classification telemetry */}
      <div className="flex-1 overflow-hidden mx-4">
        <div className="font-mono text-[11px] text-inverse-on-surface whitespace-nowrap opacity-80">
          {hotspots.length > 0
            ? statsString
            : 'AWAITING TELEMETRY'}
        </div>
      </div>

      {/* System status */}
      <div className="flex gap-4 font-mono text-[11px] text-inverse-on-surface shrink-0">

        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-primary animate-pulse"></span>
          SYS: ONLINE
        </span>

        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-primary animate-pulse"></span>
          {isDemoMode ? 'DB: DEMO CACHE' : 'DB: CONNECTED'}
        </span>

      </div>
    </footer>
  );
}