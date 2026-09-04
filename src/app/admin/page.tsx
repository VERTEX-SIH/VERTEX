'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDenied, setIsDenied] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    checkSession();
    fetchHealth();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push('/login');
      } else {
        const role = session.user?.app_metadata?.role || session.user?.user_metadata?.role;
        if (role !== 'admin') {
          setIsDenied(true);
        } else {
          setSession(session);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      setHealth(data);
      setHealthError(null);
    } catch (err: any) {
      setHealthError(err.message || 'API unreachable');
    }
  };

  const triggerIngest = async () => {
    setIngesting(true);
    setIngestStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/hotspots/classify`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Ingestion pipeline failed to start');
      const data = await res.json();
      setIngestStatus(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setIngestStatus(`Error: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="p-8 font-mono text-on-surface">Initializing secure console...</div>;
  }

  if (isDenied) {
    return (
      <div className="min-h-screen bg-surface p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl text-error font-headline-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">gpp_bad</span>
          ACCESS DENIED
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant">You do not have administrative privileges.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 bg-primary text-on-primary px-4 py-2 font-mono-label uppercase text-sm rounded-none"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between border-b border-outline-variant pb-4">
          <h1 className="font-headline-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            SYSTEM ADMINISTRATION
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-surface-container border border-outline-variant px-3 py-1 text-on-surface text-sm hover:bg-surface-container-high transition-colors font-mono-label uppercase rounded-none"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="border border-outline-variant bg-surface-container-lowest p-4 rounded-none">
            <h2 className="font-mono-label uppercase text-on-surface-variant mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
              Manual Ingestion Controls
            </h2>
            <p className="font-body-sm text-on-surface mb-4">
              Trigger the FIRMS classification pipeline manually to fetch and process the latest thermal anomalies.
            </p>
            <button
              onClick={triggerIngest}
              disabled={ingesting}
              className="bg-primary text-on-primary px-4 py-2 font-mono-label uppercase text-sm flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-colors rounded-none"
            >
              {ingesting ? (
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              ) : (
                <span className="material-symbols-outlined text-sm">play_arrow</span>
              )}
              {ingesting ? 'Processing...' : 'Run Pipeline'}
            </button>
            {ingestStatus && (
              <pre className="mt-4 p-3 bg-surface border border-outline-variant text-xs font-mono-data-sm text-on-surface overflow-x-auto whitespace-pre-wrap">
                {ingestStatus}
              </pre>
            )}
          </section>

          <section className="border border-outline-variant bg-surface-container-lowest p-4 rounded-none">
            <h2 className="font-mono-label uppercase text-on-surface-variant mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">monitor_heart</span>
              System Health
            </h2>
            {healthError ? (
              <div className="text-error font-body-sm flex items-center gap-2 border border-error bg-error-container text-on-error-container p-2">
                <span className="material-symbols-outlined">error</span>
                {healthError}
              </div>
            ) : health ? (
              <pre className="p-3 bg-surface border border-outline-variant text-xs font-mono-data-sm text-on-surface overflow-x-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              <div className="font-mono text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                Fetching health...
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
