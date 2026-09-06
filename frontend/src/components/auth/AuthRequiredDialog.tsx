'use client';

import Link from 'next/link';

export function AuthRequiredDialog() {
  return (
    <main className="flex-1 min-h-0 bg-surface-dim px-4 py-8">
      <div className="flex h-full min-h-[420px] items-center justify-center">
        <section role="dialog" aria-modal="true" aria-labelledby="access-title" className="w-full max-w-md border border-outline-variant bg-surface p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/50 bg-surface-container"><span className="material-symbols-outlined text-3xl text-primary">lock</span></div>
          <p className="mt-6 font-mono text-[10px] font-bold tracking-[.18em] text-primary">MEMBER ACCESS REQUIRED</p>
          <h1 id="access-title" className="mt-2 font-headline-sm text-2xl text-on-surface">Sign up to continue</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">The live map and analytics workspace are available to signed-in VERTEX users. Create an account or sign in to access them.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-[11px] font-bold tracking-[.1em] text-on-primary hover:bg-primary-container hover:text-on-primary-container">CREATE ACCOUNT<span className="material-symbols-outlined text-[18px]">person_add</span></Link><Link href="/login" className="flex flex-1 items-center justify-center gap-2 border border-outline-variant px-4 py-3 font-mono text-[11px] font-bold tracking-[.1em] text-on-surface hover:border-primary hover:text-primary">SIGN IN<span className="material-symbols-outlined text-[18px]">login</span></Link></div>
        </section>
      </div>
    </main>
  );
}
