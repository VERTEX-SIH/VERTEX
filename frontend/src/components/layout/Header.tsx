'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchSystemStatus } from '@/lib/api';
import { SystemStatus } from '@/types';
import { SettingsModal } from './SettingsModal';
import { AccountModal } from './AccountModal';
import { clearVertexUser, useVertexUser } from '@/lib/auth-session';

export function Header() {
  const [time, setTime] = useState<string>('');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { user, ready: authReady } = useVertexUser();

  const handleSignOut = () => {
    clearVertexUser();
    window.location.assign('/');
  };

  /*
   * =========================================================
   * IST CLOCK
   * =========================================================
   */

  useEffect(() => {
    const updateClock = () => {
      const istTime = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setTime(istTime);
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  /*
   * =========================================================
   * LIVE SYSTEM STATUS
   * =========================================================
   */

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchSystemStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      }
    };

    loadStatus();

    const interval = setInterval(loadStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  /*
   * =========================================================
   * STATUS FORMATTING
   * =========================================================
   */

  const firmsStatus =
    status?.services?.firms?.status?.toUpperCase() || 'OFFLINE';

  const firmsDisplay =
    firmsStatus === 'OK' ? 'NOMINAL' : firmsStatus;

  const isFirmsError =
    firmsStatus !== 'OK' &&
    firmsStatus !== 'NOMINAL';

  const facilityStatus =
    status?.services?.facility_data?.status?.toUpperCase() ||
    'OFFLINE';

  const facilitySource =
    status?.services?.facility_data?.source ||
    'UNKNOWN';

  const facilityDisplay =
    `${facilityStatus}/${facilitySource}`;

  const isFacilityError =
    facilityStatus === 'FAILED' ||
    facilityStatus === 'OFFLINE' ||
    facilityStatus === 'DEGRADED';

  const modelName =
    status?.classification_model ||
    'VERTEX-CLF-1.0';

  /*
   * =========================================================
   * HEADER
   * =========================================================
   */

  return (
    <header
      className="
        h-[40px]
        min-h-[40px]
        w-full
        border-b
        border-outline-variant
        bg-surface
        flex
        items-center
        justify-between
        px-0
        shrink-0
        overflow-hidden
        relative
        z-[9999]
        pointer-events-auto
      "
    >
      {/* ===================================================
          LEFT / BRAND
          =================================================== */}

      <div className="flex items-center h-full shrink-0">

        {/* Brand */}
        <div
          className="
            h-full
            w-[140px]
            flex
            items-center
            gap-2
            px-4
            border-r
            border-outline-variant
            shrink-0
          "
        >
          <span className="material-symbols-outlined text-primary text-[19px]">
            target
          </span>

          <span
            className="
              font-headline-sm
              text-primary
              text-[17px]
              tracking-wide
            "
          >
            VERTEX
          </span>
        </div>

        {/* Navigation */}
        <nav
          className="
            h-full
            flex
            items-center
            border-r
            border-outline-variant
            shrink-0
          "
        >
          <Link
            href="/"
            className="
              h-full
              min-w-[80px]
              px-4
              flex
              items-center
              justify-center
              font-mono-label
              text-[10px]
              tracking-widest
              text-secondary
              hover:text-primary
              hover:bg-surface-container
              transition-colors
            "
          >
            HOME
          </Link>

          <Link
            href="/analytics"
            className="
              h-full
              min-w-[92px]
              px-4
              flex
              items-center
              justify-center
              font-mono-label
              text-[10px]
              tracking-widest
              text-secondary
              hover:text-primary
              hover:bg-surface-container
              transition-colors
            "
          >
            ANALYTICS
          </Link>

          <Link
            href="/map"
            className="
              h-full
              min-w-[76px]
              px-4
              flex
              items-center
              justify-center
              font-mono-label
              text-[10px]
              tracking-widest
              text-secondary
              hover:text-primary
              hover:bg-surface-container
              transition-colors
            "
          >
            MAP
          </Link>

          {authReady && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="
                h-full
                min-w-[85px]
                px-3
                flex
                items-center
                justify-center
                gap-1.5
                font-mono-label
                text-[10px]
                font-bold
                tracking-widest
                text-primary
                bg-primary/10
                hover:bg-primary/20
                border-l
                border-outline-variant
                transition-colors
              "
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              ADMIN
            </Link>
          )}
        </nav>

        {/* =================================================
            LIVE TELEMETRY
            ================================================= */}

        <div
          className="
            h-full
            flex
            items-center
            gap-0
            min-w-0
            overflow-hidden
          "
        >
          {/* Clock */}
          <div
            className="
              h-full
              px-4
              flex
              items-center
              border-r
              border-outline-variant
              whitespace-nowrap
              shrink-0
            "
          >
            <span
              className="
                font-mono-data
                text-[10px]
                tracking-wider
                text-on-surface
              "
            >
              IST {time}
            </span>
          </div>

          {/* FIRMS */}
          <div
            className={`
              h-full
              px-4
              flex
              items-center
              border-r
              border-outline-variant
              whitespace-nowrap
              shrink-0
              font-mono-label
              text-[10px]
              tracking-wide
              ${
                isFirmsError
                  ? 'text-error'
                  : 'text-secondary'
              }
            `}
          >
            FIRMS VIIRS:
            <span className="ml-1 text-on-surface">
              {firmsDisplay}
            </span>
          </div>

          {/* Facilities */}
          <div
            className={`
              h-full
              px-4
              flex
              items-center
              border-r
              border-outline-variant
              whitespace-nowrap
              shrink-0
              font-mono-label
              text-[10px]
              tracking-wide
              ${
                isFacilityError
                  ? 'text-error'
                  : 'text-secondary'
              }
            `}
          >
            FACILITIES:
            <span className="ml-1 text-on-surface">
              {facilityDisplay}
            </span>
          </div>

          {/* Model */}
          <div
            className="
              h-full
              px-4
              flex
              items-center
              whitespace-nowrap
              shrink-0
              font-mono-label
              text-[10px]
              tracking-wide
              text-secondary
            "
          >
            MODEL:
            <span className="ml-1 text-on-surface">
              {modelName}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          RIGHT / ACTIONS
          =================================================== */}

      <div
        className="
          h-full
          flex
          items-center
          shrink-0
          border-l
          border-outline-variant
        "
      >
        {authReady && (user ? (
          <>
            <div className="hidden h-full max-w-[180px] items-center gap-1.5 border-r border-outline-variant px-3 sm:flex">
              <span className="material-symbols-outlined text-[18px] text-primary">
                {user.role === 'admin' ? 'shield_person' : 'verified_user'}
              </span>
              <span className="truncate font-mono text-[10px] font-bold tracking-wider text-on-surface">{user.username}</span>
              {user.role === 'admin' && (
                <span className="border border-primary bg-primary/20 px-1 py-0.2 font-mono text-[8px] font-bold tracking-widest text-primary">
                  ADMIN
                </span>
              )}
            </div>
            <button onClick={handleSignOut} className="hidden h-full items-center gap-1 px-3 font-mono-label text-[10px] tracking-widest text-secondary transition-colors hover:bg-surface-container-high hover:text-primary sm:flex" title="Sign out">
              <span className="material-symbols-outlined text-[17px]">logout</span>SIGN OUT
            </button>
          </>
        ) : (
          <>
            <Link href="/login?mode=admin" className="hidden h-full items-center gap-1 border-r border-outline-variant px-3 font-mono-label text-[10px] font-bold tracking-widest text-primary transition-colors hover:bg-primary/10 sm:flex" title="Admin Portal Sign In">
              <span className="material-symbols-outlined text-[15px]">shield_person</span>ADMIN LOGIN
            </Link>
            <Link href="/login" className="hidden h-full items-center justify-center px-3 font-mono-label text-[10px] tracking-widest text-secondary transition-colors hover:bg-surface-container-high hover:text-primary sm:flex">SIGN IN</Link>
            <Link href="/signup" className="hidden h-full items-center justify-center bg-primary px-3 font-mono-label text-[10px] font-bold tracking-widest text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container sm:flex">CREATE ACCOUNT</Link>
          </>
        ))}

        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="
            h-full
            w-[40px]
            flex
            items-center
            justify-center
            text-primary
            hover:bg-surface-container-high
            transition-colors
            cursor-pointer
          "
        >
          <span className="material-symbols-outlined text-[19px]">
            settings
          </span>
        </button>

        <button
          title="Notifications"
          className="
            h-full
            w-[40px]
            flex
            items-center
            justify-center
            text-primary
            hover:bg-surface-container-high
            transition-colors
            cursor-pointer
          "
        >
          <span className="material-symbols-outlined text-[19px]">
            notifications
          </span>
        </button>

        <button
          onClick={() => setShowAccount(true)}
          title="Account"
          className="
            h-full
            w-[40px]
            flex
            items-center
            justify-center
            text-primary
            hover:bg-surface-container-high
            transition-colors
            cursor-pointer
          "
        >
          <span className="material-symbols-outlined text-[19px]">
            account_circle
          </span>
        </button>
      </div>

      {/* ===================================================
          MODALS
          =================================================== */}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAccount && (
        <AccountModal
          onClose={() => setShowAccount(false)}
        />
      )}
    </header>
  );
}
