'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchSystemStatus } from '@/lib/api';
import { SystemStatus } from '@/types';
import { SettingsModal } from './SettingsModal';
import { AccountModal } from './AccountModal';

export function Header() {
  const [time, setTime] = useState<string>('');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

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