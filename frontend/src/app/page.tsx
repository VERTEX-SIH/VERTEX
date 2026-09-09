'use client';

import Link from 'next/link';
import { useVertexUser } from '@/lib/auth-session';

const capabilities = [
  { icon: 'satellite_alt', title: 'Observe', description: 'Continuously collect satellite thermal observations from the FIRMS feed.', number: '01' },
  { icon: 'psychology', title: 'Understand', description: 'Use AI and nearby facility context to separate industrial activity from fire risk.', number: '02' },
  { icon: 'crisis_alert', title: 'Act', description: 'Surface the most consequential events in one clear operational view.', number: '03' },
];

export default function HomePage() {
  const { user } = useVertexUser();

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-surface-dim text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(161,64,0,0.26),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(234,88,12,0.12),transparent_25%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#a1400017_1px,transparent_1px),linear-gradient(to_bottom,#a1400017_1px,transparent_1px)] bg-[size:52px_52px]" />

        <div className="relative mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 border border-primary/50 bg-surface/80 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-primary">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              LIVE THERMAL INTELLIGENCE
            </div>
            <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-secondary">VERTEX / SITUATIONAL AWARENESS PLATFORM</p>
            <h1 className="max-w-3xl font-headline-sm text-4xl leading-[1.06] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">Turn heat signals into <span className="text-primary">clearer decisions.</span></h1>
            <p className="mt-6 max-w-xl font-body-lg text-base leading-7 text-secondary sm:text-lg">VERTEX was built to help analysts quickly understand thermal anomalies across India—where they are, what they may represent, and which ones deserve attention now.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 border-2 border-primary bg-primary/20 px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-on-primary shadow-lg shadow-primary/25"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  MANAGE USERS (ADMIN)
                </Link>
              )}
              <Link href="/analytics" className="inline-flex items-center gap-2 bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container">EXPLORE ANALYTICS<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
              <Link href="/map" className="inline-flex items-center gap-2 border border-outline-variant bg-surface/80 px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary">OPEN LIVE MAP<span className="material-symbols-outlined text-[18px]">map</span></Link>
            </div>

            {user ? (
              <p className="mt-5 font-body-sm text-secondary flex flex-wrap items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">{user.role === 'admin' ? 'verified_user' : 'account_circle'}</span>
                <span>Signed in as <strong className="text-on-surface">@{user.username}</strong>{user.role === 'admin' ? ' (Administrator)' : ''}</span>
                {user.role === 'admin' && (
                  <>
                    <span className="text-outline-variant">·</span>
                    <Link href="/admin" className="font-medium text-primary hover:underline">User Management Console</Link>
                  </>
                )}
              </p>
            ) : (
              <p className="mt-5 font-body-sm text-secondary flex flex-wrap items-center gap-1.5">
                <span>New to VERTEX?</span>
                <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
                <span className="text-outline-variant">·</span>
                <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                <span className="text-outline-variant">·</span>
                <Link
                  href="/login?mode=admin"
                  className="font-mono text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 border border-primary/40 ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">shield_person</span>
                  Admin Login
                </Link>
              </p>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[510px] border border-outline-variant bg-surface/90 p-4 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3"><div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.14em] text-secondary"><span className="material-symbols-outlined text-primary text-[18px]">radar</span>EVENT OVERVIEW</div><span className="font-mono text-[9px] tracking-widest text-primary">LIVE FEED</span></div>
            <div className="relative h-[270px] overflow-hidden border border-outline-variant bg-[#17120f]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(161,64,0,.35),transparent_53%)]" /><div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#f0c89f1a_1px,transparent_1px),linear-gradient(to_bottom,#f0c89f1a_1px,transparent_1px)] bg-[size:34px_34px]" />
              <div className="absolute left-[17%] top-[25%] h-28 w-28 rounded-full border border-primary/50" /><div className="absolute left-[25%] top-[33%] h-12 w-12 rounded-full border border-primary/70" /><div className="absolute left-[31%] top-[39%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_22px_7px_rgba(234,88,12,.45)]" />
              <div className="absolute right-[20%] top-[22%] h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_15px_5px_rgba(251,146,60,.38)]" /><div className="absolute bottom-[21%] right-[31%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_6px_rgba(234,88,12,.4)]" /><div className="absolute left-[13%] bottom-[17%] h-1.5 w-1.5 rounded-full bg-amber-200" />
              <div className="absolute bottom-3 left-3 border-l-2 border-primary pl-2 font-mono text-[9px] tracking-widest text-on-surface">THERMAL CLUSTER / 28.6139° N</div>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-outline-variant border border-outline-variant"><div className="p-3"><div className="font-mono text-[9px] tracking-widest text-secondary">OBSERVED</div><div className="mt-1 font-mono text-xl text-on-surface">24/7</div></div><div className="p-3"><div className="font-mono text-[9px] tracking-widest text-secondary">CONTEXT</div><div className="mt-1 font-mono text-xl text-primary">AI</div></div><div className="p-3"><div className="font-mono text-[9px] tracking-widest text-secondary">PRIORITY</div><div className="mt-1 font-mono text-xl text-on-surface">LIVE</div></div></div>
          </div>
        </div>
      </section>

      {user?.role === 'admin' && (
        <section className="border-b border-primary/40 bg-primary/10 px-6 py-4 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary bg-surface text-primary">
                <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">ADMINISTRATOR CONTROL PRIVILEGES</span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-on-surface">You are signed in with the Admin role. You have permissions to see all users and delete them.</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.12em] text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              VIEW ALL USERS &amp; DELETE
            </Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="max-w-2xl"><p className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">WHY WE BUILT VERTEX</p><h2 className="mt-3 font-headline-sm text-3xl tracking-tight text-on-surface sm:text-4xl">More signal. Less uncertainty.</h2><p className="mt-4 font-body-md leading-7 text-secondary">Raw thermal detections alone do not explain whether an event is an industrial process, gas flare, wildfire, or something else. VERTEX brings the evidence together so teams can focus their time where it matters.</p></div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">{capabilities.map((capability) => <article key={capability.number} className="group border border-outline-variant bg-surface p-5 transition-colors hover:border-primary"><div className="flex items-start justify-between"><span className="material-symbols-outlined text-primary text-[28px]">{capability.icon}</span><span className="font-mono text-[11px] text-secondary">{capability.number}</span></div><h3 className="mt-10 font-headline-sm text-xl text-on-surface">{capability.title}</h3><p className="mt-2 font-body-sm leading-6 text-secondary">{capability.description}</p></article>)}</div>
      </section>

      <section className="border-y border-outline-variant bg-surface"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center lg:px-10"><div><p className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">READY TO INVESTIGATE</p><h2 className="mt-2 font-headline-sm text-2xl text-on-surface">See the current thermal picture.</h2></div><div className="flex flex-wrap gap-3">{user?.role === 'admin' && <Link href="/admin" className="inline-flex shrink-0 items-center gap-2 border border-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-on-primary">MANAGE USERS<span className="material-symbols-outlined text-[18px]">admin_panel_settings</span></Link>}<Link href="/map" className="inline-flex shrink-0 items-center gap-2 border border-outline-variant px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary">OPEN LIVE MAP<span className="material-symbols-outlined text-[18px]">map</span></Link><Link href="/analytics" className="inline-flex shrink-0 items-center gap-2 border border-primary bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container">OPEN ANALYTICS<span className="material-symbols-outlined text-[18px]">monitoring</span></Link></div></div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 font-mono text-[9px] tracking-[0.14em] text-secondary sm:flex-row sm:items-center sm:justify-between lg:px-10">
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
