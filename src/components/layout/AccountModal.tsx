'use client';

interface AccountModalProps {
  onClose: () => void;
}

export function AccountModal({ onClose }: AccountModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-[400px] border border-outline-variant shadow-2xl flex flex-col font-body-md">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            <h2 className="font-headline-sm text-on-surface uppercase tracking-widest text-[14px]">Operator Profile</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center border-b border-outline-variant">
          <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl text-primary">shield_person</span>
          </div>
          <h3 className="font-headline-sm text-[16px] text-on-surface tracking-widest uppercase">Admin Operator</h3>
          <p className="font-mono text-[10px] text-secondary mt-1 tracking-widest">admin@vertex-sih.gov.in</p>
          <div className="mt-3 bg-surface-container px-3 py-1 border border-outline-variant rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[9px] text-on-surface uppercase tracking-widest">Clearance: Level 5</span>
          </div>
        </div>

        <div className="p-2 flex flex-col">
          <button className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors w-full text-left">
            <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
            <span className="text-[12px] uppercase tracking-wider font-headline-sm">Access Credentials</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors w-full text-left">
            <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
            <span className="text-[12px] uppercase tracking-wider font-headline-sm">Activity Log</span>
          </button>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end">
          <button onClick={onClose} className="px-4 py-2 flex items-center gap-2 text-error hover:bg-error-container hover:text-on-error-container border border-transparent hover:border-error transition-colors w-full justify-center">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="text-[11px] font-mono-label tracking-widest">SECURE SIGN OUT</span>
          </button>
        </div>

      </div>
    </div>
  );
}
