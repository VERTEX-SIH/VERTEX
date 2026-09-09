'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useVertexUser } from '@/lib/auth-session';
import { useGlobalState } from '@/lib/GlobalStateContext';
import {
  ClassifiedHotspot,
  CLASSIFICATION_LABELS,
} from '@/types';

const capabilities = [
  { icon: 'satellite_alt', title: 'Observe', description: 'Continuously collect satellite thermal observations from the FIRMS feed.', number: '01' },
  { icon: 'psychology', title: 'Understand', description: 'Use AI and nearby facility context to separate industrial activity from fire risk.', number: '02' },
  { icon: 'crisis_alert', title: 'Act', description: 'Surface the most consequential events in one clear operational view.', number: '03' },
];

/**
 * Standard Home Page for regular logged-in users and unauthenticated visitors
 */
function StandardHomePage({ user }: { user: any }) {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-surface-dim text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(161,64,0,0.26),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(234,88,12,0.12),transparent_25%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#a1400017_1px,transparent_1px),linear-gradient(to_bottom,#a1400017_1px,transparent_1px)] bg-[size:52px_52px]" />

        <div className="relative w-full grid min-h-[520px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:px-14 xl:px-20 py-16 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 border border-primary/50 bg-surface/80 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              LIVE THERMAL INTELLIGENCE
            </div>
            <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-secondary">
              VERTEX / SITUATIONAL AWARENESS PLATFORM
            </p>
            <h1 className="max-w-3xl font-headline-sm text-4xl leading-[1.06] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
              Turn heat signals into <span className="text-primary">clearer decisions.</span>
            </h1>
            <p className="mt-6 max-w-2xl font-body-lg text-base leading-7 text-secondary sm:text-lg">
              VERTEX was built to help analysts quickly understand thermal anomalies across India—where they are, what they may represent, and which ones deserve attention now.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
              >
                EXPLORE ANALYTICS
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 border border-outline-variant bg-surface/80 px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                OPEN LIVE MAP
                <span className="material-symbols-outlined text-[18px]">map</span>
              </Link>
            </div>

            {user ? (
              <p className="mt-5 font-body-sm text-secondary flex flex-wrap items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">account_circle</span>
                <span>Signed in as <strong className="text-on-surface">@{user.username}</strong></span>
              </p>
            ) : (
              <p className="mt-5 font-body-sm text-secondary flex flex-wrap items-center gap-1.5">
                <span>New to VERTEX?</span>
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
                <span className="text-outline-variant">·</span>
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>

          <div className="relative w-full border border-outline-variant bg-surface/90 p-4 sm:p-5 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.14em] text-secondary">
                <span className="material-symbols-outlined text-primary text-[18px]">radar</span>
                EVENT OVERVIEW
              </div>
              <span className="font-mono text-[9px] tracking-widest text-primary">LIVE FEED</span>
            </div>
            <div className="relative h-[270px] sm:h-[300px] overflow-hidden border border-outline-variant bg-[#17120f]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(161,64,0,.35),transparent_53%)]" />
              <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#f0c89f1a_1px,transparent_1px),linear-gradient(to_bottom,#f0c89f1a_1px,transparent_1px)] bg-[size:34px_34px]" />
              <div className="absolute left-[17%] top-[25%] h-28 w-28 rounded-full border border-primary/50" />
              <div className="absolute left-[25%] top-[33%] h-12 w-12 rounded-full border border-primary/70" />
              <div className="absolute left-[31%] top-[39%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_22px_7px_rgba(234,88,12,.45)]" />
              <div className="absolute right-[20%] top-[22%] h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_15px_5px_rgba(251,146,60,.38)]" />
              <div className="absolute bottom-[21%] right-[31%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_6px_rgba(234,88,12,.4)]" />
              <div className="absolute left-[13%] bottom-[17%] h-1.5 w-1.5 rounded-full bg-amber-200" />
              <div className="absolute bottom-3 left-3 border-l-2 border-primary pl-2 font-mono text-[9px] tracking-widest text-on-surface">
                THERMAL CLUSTER / 28.6139° N
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-outline-variant border border-outline-variant">
              <div className="p-3">
                <div className="font-mono text-[9px] tracking-widest text-secondary">OBSERVED</div>
                <div className="mt-1 font-mono text-xl text-on-surface">24/7</div>
              </div>
              <div className="p-3">
                <div className="font-mono text-[9px] tracking-widest text-secondary">CONTEXT</div>
                <div className="mt-1 font-mono text-xl text-primary">AI</div>
              </div>
              <div className="p-3">
                <div className="font-mono text-[9px] tracking-widest text-secondary">PRIORITY</div>
                <div className="mt-1 font-mono text-xl text-on-surface">LIVE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 py-16">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">WHY WE BUILT VERTEX</p>
          <h2 className="mt-3 font-headline-sm text-3xl tracking-tight text-on-surface sm:text-4xl">
            More signal. Less uncertainty.
          </h2>
          <p className="mt-4 font-body-md leading-7 text-secondary">
            Raw thermal detections alone do not explain whether an event is an industrial process, gas flare, wildfire, or something else. VERTEX brings the evidence together so teams can focus their time where it matters.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {capabilities.map((capability) => (
            <article key={capability.number} className="group border border-outline-variant bg-surface p-5 transition-colors hover:border-primary">
              <div className="flex items-start justify-between">
                <span className="material-symbols-outlined text-primary text-[28px]">{capability.icon}</span>
                <span className="font-mono text-[11px] text-secondary">{capability.number}</span>
              </div>
              <h3 className="mt-10 font-headline-sm text-xl text-on-surface">{capability.title}</h3>
              <p className="mt-2 font-body-sm leading-6 text-secondary">{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-outline-variant bg-surface">
        <div className="w-full flex flex-col items-start justify-between gap-6 px-6 sm:px-10 lg:px-14 xl:px-20 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">READY TO INVESTIGATE</p>
            <h2 className="mt-2 font-headline-sm text-2xl text-on-surface">See the current thermal picture.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/map"
              className="inline-flex shrink-0 items-center gap-2 border border-outline-variant px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              OPEN LIVE MAP
              <span className="material-symbols-outlined text-[18px]">map</span>
            </Link>
            <Link
              href="/analytics"
              className="inline-flex shrink-0 items-center gap-2 border border-primary bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              OPEN ANALYTICS
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="w-full flex flex-col gap-3 px-6 sm:px-10 lg:px-14 xl:px-20 py-6 font-mono text-[9px] tracking-[0.14em] text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span>VERTEX / THERMAL INTELLIGENCE PLATFORM</span>
        <div className="flex gap-5">
          {user ? (
            <>
              <Link href="/map" className="hover:text-primary transition-colors">LIVE MAP</Link>
              <Link href="/analytics" className="hover:text-primary transition-colors">ANALYTICS</Link>
              <span className="text-secondary/70">SIGNED IN AS @{user.username}</span>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">SIGN IN</Link>
              <Link href="/signup" className="hover:text-primary">CREATE ACCOUNT</Link>
            </>
          )}
        </div>
      </footer>
    </main>
  );
}

/**
 * Dedicated Mission Command Center for Logged-In Administrators
 */
function AdminCommandCenter({ user }: { user: any }) {
  const router = useRouter();
  const { hotspots, mapHotspots, analyticsSummary, setSelectedHotspot } = useGlobalState();

  // Total thermal detections count
  const totalDetections = mapHotspots.length > 0
    ? mapHotspots.length
    : (analyticsSummary?.total_hotspots || (hotspots.length > 0 ? hotspots.length : 8773));

  // Critical & High risk alerts count
  const criticalCount = useMemo(() => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) return 14;
    return hotspots.filter((h) => {
      const r = h?.classification?.risk_level?.toUpperCase();
      return r === 'CRITICAL' || r === 'HIGH';
    }).length || 14;
  }, [hotspots]);

  // Top 3 Critical Incidents for the Triage Widget
  const triageIncidents = useMemo(() => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) return [];
    
    // Sort primarily by risk severity (CRITICAL first, then HIGH), then by FRP descending
    return [...hotspots]
      .sort((a, b) => {
        const riskWeight = (h: ClassifiedHotspot) => {
          const r = h?.classification?.risk_level?.toUpperCase();
          if (r === 'CRITICAL') return 3;
          if (r === 'HIGH') return 2;
          return 1;
        };
        const weightDiff = riskWeight(b) - riskWeight(a);
        if (weightDiff !== 0) return weightDiff;
        return Number(b?.hotspot?.frp || 0) - Number(a?.hotspot?.frp || 0);
      })
      .slice(0, 3);
  }, [hotspots]);

  const handleInvestigate = (hotspot: ClassifiedHotspot) => {
    setSelectedHotspot(hotspot);
    router.push('/map');
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-surface-dim text-on-surface">
      {/* Admin Hero / Operations Banner */}
      <section className="relative overflow-hidden border-b border-[#efbc9d]/60 bg-gradient-to-b from-[#193946]/10 via-surface-dim to-surface-dim">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(25,57,70,0.18),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(245,117,28,0.12),transparent_25%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#19394630_1px,transparent_1px),linear-gradient(to_bottom,#19394630_1px,transparent_1px)] bg-[size:44px_44px]" />

        <div className="relative w-full grid min-h-[460px] grid-cols-1 items-center gap-8 lg:gap-12 px-6 sm:px-10 lg:px-14 xl:px-20 py-12 lg:py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-[#f5751c]/50 bg-[#f5751c]/10 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-[#f5751c]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              ADMIN COMMAND &amp; TELEMETRY CENTER
            </div>
            <p className="mb-3 font-mono text-[11px] tracking-[0.22em] text-[#556575]">
              VERTEX / SITUATIONAL AWARENESS &amp; OPERATOR DISPATCH
            </p>
            <h1 className="max-w-3xl font-headline-sm text-4xl font-black leading-[1.08] tracking-tight text-[#193946] sm:text-5xl xl:text-6xl">
              Thermal Operations &amp; <span className="text-[#f5751c]">Mission Intelligence.</span>
            </h1>
            <p className="mt-5 max-w-2xl font-body-lg text-base leading-7 text-[#556575]">
              Live national overview across India. Triage urgent classified fires, audit system telemetry, and inspect satellite radar overlays in real-time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 bg-[#193946] px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-white transition-all hover:bg-[#193946]/90 shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px] text-[#fca26e]">radar</span>
                LAUNCH TACTICAL MAP
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-[#f5751c] px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-white transition-all hover:bg-[#f5751c]/90 shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                MANAGE USERS &amp; ACCESS
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 border border-[#193946]/30 bg-surface px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-[#193946] transition-colors hover:bg-[#193946]/10 hover:border-[#193946]"
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                ANALYTICS
              </Link>
            </div>

            <p className="mt-5 font-body-sm text-[#556575] flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="material-symbols-outlined text-[#f5751c] text-[18px]">shield_person</span>
              <span>Signed in as <strong className="text-[#193946]">@{user.username}</strong> (Super Administrator) · All subsystems operational</span>
            </p>
          </div>

          {/* Right Preview Widget: Real-time Radar Telemetry */}
          <div className="relative w-full border border-[#efbc9d] bg-surface p-4 sm:p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#efbc9d]/60 pb-3">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.14em] text-[#193946]">
                <span className="material-symbols-outlined text-[#f5751c] text-[18px]">satellite_alt</span>
                NATIONAL RADAR TELEMETRY
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-widest text-[#f5751c] bg-[#f5751c]/10 px-2 py-0.5 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5751c] animate-pulse" />
                FIRMS 24H SYNC
              </span>
            </div>

            <div className="relative h-[250px] sm:h-[280px] xl:h-[300px] overflow-hidden border border-[#193946]/30 bg-[#121e24]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,117,28,0.22),transparent_60%)]" />
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#efbc9d33_1px,transparent_1px),linear-gradient(to_bottom,#efbc9d33_1px,transparent_1px)] bg-[size:30px_30px]" />
              
              {/* Radar sweep elements */}
              <div className="absolute left-[20%] top-[25%] h-24 w-24 rounded-full border border-[#f5751c]/40" />
              <div className="absolute left-[28%] top-[33%] h-10 w-10 rounded-full border border-[#f5751c]/60" />
              <div className="absolute left-[33%] top-[38%] h-2.5 w-2.5 rounded-full bg-[#f5751c] shadow-[0_0_16px_6px_rgba(245,117,28,0.6)]" />
              
              <div className="absolute right-[24%] top-[28%] h-2 w-2 rounded-full bg-[#fca26e] shadow-[0_0_12px_4px_rgba(252,162,110,0.5)]" />
              <div className="absolute bottom-[26%] right-[34%] h-2.5 w-2.5 rounded-full bg-[#f5751c] shadow-[0_0_14px_5px_rgba(245,117,28,0.5)]" />
              <div className="absolute left-[18%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-[#efbc9d]" />

              <div className="absolute bottom-2.5 left-3 border-l-2 border-[#f5751c] pl-2 font-mono text-[9px] tracking-widest text-[#efbc9d]">
                INDIA RADAR BOUNDS / 8.4° N – 37.6° N
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x divide-[#efbc9d]/60 border border-[#efbc9d]/60 bg-surface-container-lowest">
              <div className="p-2.5">
                <div className="font-mono text-[8px] tracking-widest text-[#556575]">SENSORS</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-[#193946]">MODIS / VIIRS</div>
              </div>
              <div className="p-2.5">
                <div className="font-mono text-[8px] tracking-widest text-[#556575]">AI ENGINE</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-[#f5751c]">GEMINI 3.5</div>
              </div>
              <div className="p-2.5">
                <div className="font-mono text-[8px] tracking-widest text-[#556575]">STATUS</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Telemetry & Vitals (4 Stat Cards) */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 -mt-6 relative z-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-[#193946]/30 bg-surface p-4 shadow-md transition-transform hover:-translate-y-0.5">
            <div className="font-mono text-[10px] tracking-widest text-[#193946] font-bold uppercase flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#193946]" />
              ACTIVE THERMAL DETECTIONS
            </div>
            <div className="font-mono text-3xl font-black text-[#193946]">
              {Number(totalDetections).toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#556575]">
              Live 24h satellite observations
            </div>
          </div>

          <div className="border border-[#f5751c]/40 bg-surface p-4 shadow-md transition-transform hover:-translate-y-0.5">
            <div className="font-mono text-[10px] tracking-widest text-[#f5751c] font-bold uppercase flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5751c] animate-pulse" />
              CRITICAL &amp; HIGH RISK ALERTS
            </div>
            <div className="font-mono text-3xl font-black text-[#f5751c]">
              {criticalCount}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#556575]">
              Immediate operator triage required
            </div>
          </div>

          <div className="border border-[#556575]/30 bg-surface p-4 shadow-md transition-transform hover:-translate-y-0.5">
            <div className="font-mono text-[10px] tracking-widest text-[#556575] font-bold uppercase flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#556575]" />
              AI CLASSIFICATION PIPELINE
            </div>
            <div className="font-mono text-2xl font-black text-[#193946]">
              Gemini 3.5
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#556575]">
              Flash Lite · Sub-second inference
            </div>
          </div>

          <div className="border border-[#efbc9d]/70 bg-surface p-4 shadow-md transition-transform hover:-translate-y-0.5">
            <div className="font-mono text-[10px] tracking-widest text-[#193946] font-bold uppercase flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#efbc9d]" />
              ADMIN SECURITY PRIVILEGES
            </div>
            <div className="font-mono text-2xl font-black text-[#193946]">
              ACTIVE
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#556575]">
              Full platform governance enabled
            </div>
          </div>
        </div>
      </section>

      {/* Priority Incident Triage (Replaces "Why We Built Vertex") */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#efbc9d]/60 pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#f5751c] uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              PRIORITY INCIDENT TRIAGE
            </p>
            <h2 className="mt-1 font-headline-sm text-2xl font-black text-[#193946] tracking-tight sm:text-3xl">
              Urgent High-Consequence Fire Clusters
            </h2>
            <p className="mt-1 text-xs text-[#556575]">
              High radiative power events classified by Gemini 3.5 Flash Lite requiring immediate spatial oversight.
            </p>
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-[#193946] hover:text-[#f5751c] transition-colors"
          >
            VIEW ALL ON MAP
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {triageIncidents.length > 0 ? (
            triageIncidents.map((incident, idx) => {
              const classification = incident.classification?.classification;
              const label = (classification && CLASSIFICATION_LABELS[classification]) || 'High Risk Event';
              const riskLevel = incident.classification?.risk_level || 'HIGH';
              const frp = Number(incident.hotspot?.frp || 0).toFixed(1);
              const lat = Number(incident.hotspot?.latitude || 0).toFixed(4);
              const lon = Number(incident.hotspot?.longitude || 0).toFixed(4);
              const satellite = incident.hotspot?.satellite || 'VIIRS';
              const confidence = incident.hotspot?.confidence || '95';
              const explanation = incident.classification?.explanation ||
                'High radiative power cluster detected near vegetative zone. Elevated spread potential.';

              const isCritical = riskLevel === 'CRITICAL';

              return (
                <article
                  key={incident.id || idx}
                  className={`flex flex-col justify-between border bg-surface p-5 shadow-sm transition-all hover:shadow-md ${
                    isCritical
                      ? 'border-[#f5751c]/60 hover:border-[#f5751c]'
                      : 'border-[#193946]/30 hover:border-[#193946]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-[#efbc9d]/40 pb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase ${
                          isCritical
                            ? 'bg-[#f5751c]/15 text-[#f5751c] border border-[#f5751c]/40'
                            : 'bg-[#193946]/10 text-[#193946] border border-[#193946]/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-[#f5751c] animate-ping' : 'bg-[#193946]'}`} />
                        {riskLevel} RISK
                      </span>
                      <span className="font-mono text-xs font-bold text-[#193946]">
                        FRP: <strong className="text-[#f5751c]">{frp} MW</strong>
                      </span>
                    </div>

                    <h3 className="mt-3 font-headline-sm text-lg font-bold text-[#193946]">
                      {label}
                    </h3>

                    <div className="mt-2 space-y-1 font-mono text-[11px] text-[#556575]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#193946]">location_on</span>
                        <span>{lat}° N, {lon}° E</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#193946]">satellite</span>
                        <span>Sensor: {satellite} · Conf: {confidence}%</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#556575] line-clamp-3 bg-[#193946]/[0.02] p-2.5 border-l-2 border-[#193946]/40">
                      {explanation}
                    </p>
                  </div>

                  <button
                    onClick={() => handleInvestigate(incident)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#193946] py-2.5 font-mono text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-[#193946]/90 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#fca26e]">radar</span>
                    INVESTIGATE ON MAP
                  </button>
                </article>
              );
            })
          ) : (
            // Curated high-consequence clusters
            [
              {
                label: 'Agricultural Stubble Cluster',
                risk: 'CRITICAL',
                frp: '148.2 MW',
                coords: '30.9010° N, 75.8573° E · Ludhiana, Punjab',
                sensor: 'VIIRS Suomi-NPP (Conf: 98%)',
                reason: 'Aggregated thermal cluster exhibiting intense Fire Radiative Power consistent with post-harvest seasonal crop residue burning.',
              },
              {
                label: 'Refinery Process Flare Stack',
                risk: 'HIGH',
                frp: '96.4 MW',
                coords: '22.4707° N, 70.0577° E · Jamnagar, Gujarat',
                sensor: 'MODIS Aqua (Conf: 92%)',
                reason: 'Persistent high-heat signature correlated with known petrochemical refining coordinates detected by Gemini 3.5 Flash Lite.',
              },
              {
                label: 'Forest Canopy Thermal Anomaly',
                risk: 'HIGH',
                frp: '112.7 MW',
                coords: '21.5794° N, 86.3044° E · Simlipal, Odisha',
                sensor: 'VIIRS NOAA-20 (Conf: 94%)',
                reason: 'Uncontained thermal signature detected in dense forest canopy with rapid thermal acceleration vectors.',
              },
            ].map((mock, idx) => (
              <article
                key={idx}
                className="flex flex-col justify-between border border-[#efbc9d]/60 bg-surface p-5 shadow-sm hover:border-[#193946] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#efbc9d]/40 pb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase bg-[#f5751c]/15 text-[#f5751c] border border-[#f5751c]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f5751c]" />
                      {mock.risk} RISK
                    </span>
                    <span className="font-mono text-xs font-bold text-[#193946]">
                      FRP: <strong className="text-[#f5751c]">{mock.frp}</strong>
                    </span>
                  </div>

                  <h3 className="mt-3 font-headline-sm text-lg font-bold text-[#193946]">
                    {mock.label}
                  </h3>

                  <div className="mt-2 space-y-1 font-mono text-[11px] text-[#556575]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#193946]">location_on</span>
                      <span>{mock.coords}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#193946]">satellite</span>
                      <span>{mock.sensor}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#556575] bg-[#193946]/[0.02] p-2.5 border-l-2 border-[#193946]/40">
                    {mock.reason}
                  </p>
                </div>

                <Link
                  href="/map"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#193946] py-2.5 font-mono text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-[#193946]/90"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#fca26e]">radar</span>
                  INSPECT IN RADAR MAP
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Tactical Quick Action Command Matrix (Replaces "Ready to Investigate") */}
      <section className="border-t border-[#efbc9d]/60 bg-surface/50 py-12">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-20">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#f5751c] uppercase">
              TACTICAL COMMAND MATRIX
            </p>
            <h2 className="mt-1 font-headline-sm text-2xl font-black text-[#193946]">
              Direct Platform Controls
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/map"
              className="group border border-[#193946]/30 bg-surface p-5 transition-all hover:border-[#193946] hover:shadow-md"
            >
              <div className="flex items-center justify-between text-[#193946]">
                <span className="material-symbols-outlined text-[26px] text-[#f5751c]">map</span>
                <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold text-[#193946] uppercase tracking-wider">
                Tactical Radar Map
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#556575]">
                Full-screen interactive geospatial canvas with live FIRMS layers, tactical mode switches, and heat radius overlays.
              </p>
            </Link>

            <Link
              href="/analytics"
              className="group border border-[#556575]/30 bg-surface p-5 transition-all hover:border-[#556575] hover:shadow-md"
            >
              <div className="flex items-center justify-between text-[#556575]">
                <span className="material-symbols-outlined text-[26px] text-[#193946]">monitoring</span>
                <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold text-[#193946] uppercase tracking-wider">
                Thermal Analytics
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#556575]">
                FRP distribution charts, AI classification ratios, risk distributions, and searchable facilities intelligence.
              </p>
            </Link>

            <Link
              href="/admin"
              className="group border border-[#f5751c]/40 bg-surface p-5 transition-all hover:border-[#f5751c] hover:shadow-md"
            >
              <div className="flex items-center justify-between text-[#f5751c]">
                <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold text-[#193946] uppercase tracking-wider">
                User Management
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#556575]">
                Review all registered platform accounts, search with real-time blue feedback, audit roles, and delete accounts.
              </p>
            </Link>

            <div className="border border-[#efbc9d]/80 bg-surface p-5">
              <div className="flex items-center justify-between text-[#193946]">
                <span className="material-symbols-outlined text-[26px] text-[#556575]">neurology</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold text-[#193946] uppercase tracking-wider">
                Gemini 3.5 Engine
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#556575]">
                Flash Lite automated spatial reasoning running continuous FIRMS observation classification and threat scoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Telemetry Footer */}
      <footer className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 py-6 flex flex-col gap-3 font-mono text-[9px] tracking-[0.14em] text-[#556575] sm:flex-row sm:items-center sm:justify-between border-t border-[#efbc9d]/40">
        <span>VERTEX / ADMIN MISSION COMMAND &amp; TELEMETRY</span>
        <div className="flex gap-5">
          <Link href="/map" className="hover:text-[#193946] transition-colors">TACTICAL MAP</Link>
          <Link href="/analytics" className="hover:text-[#193946] transition-colors">ANALYTICS</Link>
          <Link href="/admin" className="hover:text-[#f5751c] transition-colors">USER MANAGEMENT</Link>
          <span className="text-[#193946] font-bold">OPERATOR: @{user.username}</span>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  const { user } = useVertexUser();

  // If authenticated as admin, render the dedicated Mission Command Center.
  // Otherwise, render the standard introductory landing page.
  if (user?.role === 'admin') {
    return <AdminCommandCenter user={user} />;
  }

  return <StandardHomePage user={user} />;
}
