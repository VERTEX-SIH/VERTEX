'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BottomTicker } from '@/components/layout/BottomTicker';
import { useGlobalState } from '@/lib/GlobalStateContext';

export default function SignupPage() {
  const router = useRouter();
  const { hotspots } = useGlobalState();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Inject Google Identity Services (GIS) JavaScript SDK dynamically
    const scriptId = 'google-gis-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleGis();
      };
      document.body.appendChild(script);
    } else {
      initGoogleGis();
    }
  }, []);

  const initGoogleGis = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleGisResponse,
        });
      } catch (e) {
        console.warn('Google GIS initialization warning:', e);
      }
    }
  };

  const handleGoogleGisResponse = async (response: any) => {
    if (response?.credential) {
      setGoogleLoading(true);
      setError(null);
      try {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });
        if (error) {
          setError(`Google Auth Error: ${error.message}`);
        } else if (data?.session) {
          setMessage('Google identity verified! Accessing console...');
          setTimeout(() => router.push('/admin'), 1000);
        }
      } catch (err: any) {
        setError(err.message || 'Google token verification failed.');
      } finally {
        setGoogleLoading(false);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data?.user && !data?.session) {
        setMessage('Registration submitted! Please check your email inbox to verify your address.');
      } else {
        setMessage('Operator account created successfully! Initializing console...');
        setTimeout(() => router.push('/admin'), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication gateway error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerSupabaseOAuth = async () => {
    try {
      const redirectUrl = `${window.location.origin}/admin`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          setError('Google Sign-In is not enabled on your Supabase backend yet. Please enable the Google provider in Supabase Dashboard -> Authentication -> Providers.');
        } else {
          setError(`Google OAuth Error: ${error.message}`);
        }
        setGoogleLoading(false);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google OAuth connection.');
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const gisAvailable = typeof window !== 'undefined' && (window as any).google?.accounts?.id;

    if (gisAvailable && googleClientId) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            triggerSupabaseOAuth();
          }
        });
        return;
      } catch (e) {
        console.warn('Google GIS prompt fallback to standard OAuth');
      }
    }

    await triggerSupabaseOAuth();
  };

  return (
    <>
      <main className="flex-1 relative w-full h-[calc(100vh-72px)] mt-[40px] mb-[32px] overflow-hidden bg-surface-dim bg-[radial-gradient(#a14000_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center p-4">
        
        {/* BACKGROUND TACTICAL GRID OVERLAYS */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-dim/80 via-transparent to-surface-dim/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2bfb00a_1px,transparent_1px),linear-gradient(to_bottom,#e2bfb00a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* AUTHENTICATION TACTICAL CARD */}
        <div className="w-full max-w-[440px] bg-surface-container-low/95 border border-outline-variant shadow-2xl backdrop-blur-md relative z-10 overflow-hidden flex flex-col my-auto">
          
          {/* FIRE ORANGE GRADIENT TOP ACCENT */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-orange-500 to-amber-500 shrink-0" />

          {/* CARD HEADER */}
          <div className="p-5 border-b border-outline-variant bg-surface shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl animate-pulse">
                target
              </span>
              <div>
                <h1 className="font-headline-sm text-primary text-[15px] tracking-wider uppercase">
                  VERTEX // ENROLLMENT GATEWAY
                </h1>
                <div className="font-mono text-[9px] text-secondary tracking-widest uppercase mt-0.5">
                  NEW OPERATOR ENROLLMENT CONSOLE
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-1 border border-outline-variant">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0" />
              <span className="font-mono text-[9px] text-on-surface font-bold">ONLINE</span>
            </div>
          </div>

          {/* MODE TABS (STREAM / FILTER TAB STYLE) */}
          <div className="flex border-b border-outline-variant bg-surface shrink-0">
            <Link
              href="/login"
              className="flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors border-b-2 border-transparent font-mono-label text-[10px] tracking-widest uppercase text-secondary hover:bg-surface-container-high hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">radar</span>
              LOG IN
            </Link>

            <div
              className="flex-1 py-2.5 flex items-center justify-center gap-2 border-b-2 border-primary bg-surface-container-highest font-mono-label text-[10px] tracking-widest uppercase text-on-surface font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              SIGN UP
            </div>
          </div>

          {/* CARD BODY */}
          <div className="p-6 overflow-y-auto space-y-5">

            {/* GMAIL / GOOGLE OAUTH BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 bg-surface border border-outline-variant hover:border-primary text-on-surface font-mono-label text-[11px] tracking-wider transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 group hover:bg-surface-container-high"
              >
                {googleLoading ? (
                  <span className="animate-spin material-symbols-outlined text-[18px] text-primary">progress_activity</span>
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span className="group-hover:text-primary transition-colors uppercase font-bold">
                  {googleLoading ? 'CONNECTING GMAIL...' : 'SIGN UP WITH GMAIL / GOOGLE'}
                </span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-outline-variant" />
              <span className="absolute bg-surface-container-low px-2 font-mono text-[9px] text-secondary uppercase tracking-widest">
                OR NEW CREDENTIAL ENROLLMENT
              </span>
            </div>

            {/* ALERTS */}
            {error && (
              <div className="bg-error-container text-on-error-container p-3 border border-error text-[11px] font-mono leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-error shrink-0 mt-0.5">warning</span>
                <div>
                  <div className="font-bold uppercase tracking-wider">REGISTRATION ERROR</div>
                  <div className="mt-0.5 opacity-90">{error}</div>
                </div>
              </div>
            )}

            {message && (
              <div className="bg-surface-container-high text-primary p-3 border border-primary text-[11px] font-mono leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold uppercase tracking-wider">SYSTEM NOTICE</div>
                  <div className="mt-0.5 text-on-surface">{message}</div>
                </div>
              </div>
            )}

            {/* CREDENTIAL FORM */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <div className="font-mono-label text-[10px] text-secondary mb-1 tracking-widest uppercase">
                  OPERATOR USERNAME
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator_delta"
                  className="w-full bg-surface border border-outline-variant px-3 py-2 font-mono-data-md text-[12px] text-on-surface focus:border-primary outline-none transition-colors placeholder:text-secondary/40"
                  required
                />
              </div>

              <div>
                <div className="font-mono-label text-[10px] text-secondary mb-1 tracking-widest uppercase">
                  OPERATOR EMAIL
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@ntro.gov.in"
                  className="w-full bg-surface border border-outline-variant px-3 py-2 font-mono-data-md text-[12px] text-on-surface focus:border-primary outline-none transition-colors placeholder:text-secondary/40"
                  required
                />
              </div>

              <div>
                <div className="font-mono-label text-[10px] text-secondary mb-1 tracking-widest uppercase">
                  SECURITY KEY / PASSWORD
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface border border-outline-variant px-3 py-2 font-mono-data-md text-[12px] text-on-surface focus:border-primary outline-none transition-colors placeholder:text-secondary/40"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary text-on-primary font-mono-label text-[11px] font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                )}
                {loading ? 'PROCESSING ENROLLMENT...' : 'CREATE OPERATOR ACCOUNT'}
              </button>
            </form>
          </div>

          {/* CARD FOOTER */}
          <div className="p-3 border-t border-outline-variant bg-surface shrink-0 flex items-center justify-between font-mono text-[10px] text-secondary">
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              RETURN TO PLATFORM
            </Link>

            <Link
              href="/login"
              className="hover:text-primary transition-colors uppercase tracking-wider text-right font-bold text-primary"
            >
              ALREADY REGISTERED? LOG IN
            </Link>
          </div>
        </div>
      </main>

      {/* BOTTOM TICKER FOOTER */}
      <BottomTicker hotspots={hotspots} />
    </>
  );
}
