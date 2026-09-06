'use client';

import { useState } from 'react';
import { useGlobalState } from '@/lib/GlobalStateContext';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { mapStyle, setMapStyle } = useGlobalState();
  const [localMapStyle, setLocalMapStyle] = useState(mapStyle);

  const handleSave = () => {
    setMapStyle(localMapStyle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-[500px] border border-outline-variant shadow-2xl flex flex-col font-body-md">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            <h2 className="font-headline-sm text-on-surface uppercase tracking-widest text-[14px]">Platform Settings</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          <div>
            <h3 className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-3">Map & Telemetry</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant">
                <span className="text-[12px] text-on-surface">Base Map Layer</span>
                <select 
                  value={localMapStyle} 
                  onChange={(e) => setLocalMapStyle(e.target.value)}
                  className="bg-surface border border-outline-variant text-[11px] font-mono px-2 py-1 outline-none focus:border-primary"
                >
                  <option>Esri World Imagery (Satellite)</option>
                  <option>Dark Canvas</option>
                  <option>Dark Tactical</option>
                  <option>OSM Light</option>
                </select>
              </div>
              <div className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant">
                <span className="text-[12px] text-on-surface">Auto-Refresh Interval</span>
                <select className="bg-surface border border-outline-variant text-[11px] font-mono px-2 py-1 outline-none focus:border-primary">
                  <option>30 Minutes</option>
                  <option>1 Hour</option>
                  <option>6 Hours</option>
                  <option>Manual Only</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-3">Classification & AI</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant">
                <span className="text-[12px] text-on-surface">Minimum Confidence Display</span>
                <div className="flex items-center gap-2">
                  <input type="range" className="accent-primary w-24" min="0" max="1" step="0.1" defaultValue="0.3" />
                  <span className="font-mono text-[10px] w-8 text-right">0.30</span>
                </div>
              </div>
              <label className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant cursor-pointer group">
                <span className="text-[12px] text-on-surface">Strict Risk Filtering</span>
                <input type="checkbox" className="accent-primary w-4 h-4 bg-surface border-outline-variant" defaultChecked />
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-mono-label text-[10px] text-secondary tracking-widest uppercase mb-3">System</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between bg-surface-container p-3 border border-outline-variant cursor-pointer group">
                <span className="text-[12px] text-on-surface">Critical Notifications</span>
                <input type="checkbox" className="accent-primary w-4 h-4 bg-surface border-outline-variant" defaultChecked />
              </label>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-outline-variant text-secondary text-[11px] font-mono-label tracking-widest hover:bg-surface-container-high transition-colors">
            CANCEL
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-on-primary text-[11px] font-mono-label tracking-widest hover:bg-primary-container transition-colors">
            SAVE SETTINGS
          </button>
        </div>

      </div>
    </div>
  );
}
