'use client';

import Link from 'next/link';
import { useVertexUser, clearVertexUser } from '@/lib/auth-session';

interface AccountModalProps {
  onClose: () => void;
}

export function AccountModal({ onClose }: AccountModalProps) {
  const { user } = useVertexUser();

  const handleSignOut = () => {
    clearVertexUser();
    onClose();
    window.location.assign('/');
  };

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

        {user ? (
          <>
            <div className="p-6 flex flex-col items-center border-b border-outline-variant">
              <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl text-primary">
                  {user.role === 'admin' ? 'shield_person' : 'person'}
                </span>
              </div>
              <h3 className="font-headline-sm text-[16px] text-on-surface tracking-widest uppercase">
                {user.fullName || user.username}
              </h3>
              <p className="font-mono text-[11px] text-secondary mt-1 tracking-widest">@{user.username}</p>
              <div className="mt-3 bg-surface-container px-3 py-1 border border-outline-variant rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-[9px] text-on-surface uppercase tracking-widest">
                  ROLE: {user.role.toUpperCase()} {user.role === 'admin' ? '(LEVEL 5 CLEARANCE)' : '(ANALYST)'}
                </span>
              </div>
            </div>

            <div className="p-2 flex flex-col">
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 hover:bg-primary/20 transition-colors w-full text-left font-medium border-b border-outline-variant/60"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">admin_panel_settings</span>
                  <span className="text-[12px] uppercase tracking-wider font-headline-sm">Admin Console (Manage Users)</span>
                </Link>
              )}
              <Link
                href="/analytics"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">monitoring</span>
                <span className="text-[12px] uppercase tracking-wider font-headline-sm">Analytics Platform</span>
              </Link>
              <Link
                href="/map"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
                <span className="text-[12px] uppercase tracking-wider font-headline-sm">Thermal Map</span>
              </Link>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 flex items-center gap-2 text-error hover:bg-error-container hover:text-on-error-container border border-transparent hover:border-error transition-colors w-full justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="text-[11px] font-mono-label tracking-widest">SECURE SIGN OUT</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-secondary">lock</span>
            <p className="text-center text-sm text-secondary">No operator currently signed in.</p>
            <div className="flex w-full flex-col gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="w-full bg-primary py-2.5 text-center font-mono text-xs font-bold tracking-widest text-on-primary hover:bg-primary-container hover:text-on-primary-container"
              >
                SIGN IN
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full border border-outline-variant py-2.5 text-center font-mono text-xs font-bold tracking-widest text-on-surface hover:border-primary hover:text-primary"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
