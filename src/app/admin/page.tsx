'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import { AuthRequiredDialog } from '@/components/auth/AuthRequiredDialog';
import { useVertexUser, setVertexUser } from '@/lib/auth-session';
import { supabase } from '@/lib/supabase';

type ManagedUser = {
  id: string;
  username: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export default function AdminPage() {
  const { user, ready } = useVertexUser();
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  // Auto-verify if adminPassword was saved in current tab session
  useEffect(() => {
    if (ready && user && user.role === 'admin' && user.adminPassword && !verified) {
      setPassword(user.adminPassword);
      executeLoadUsers(user.adminPassword);
    }
  }, [ready, user, verified]);

  const executeLoadUsers = async (adminPass: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.rpc('list_users', { p_admin_password: adminPass });
      const result = data as { success?: boolean; message?: string; users?: ManagedUser[] } | null;

      if (error || !result?.success) {
        setVerified(false);
        setMessage({
          text: error?.message || result?.message || 'Unable to verify administrator access.',
          type: 'error',
        });
      } else {
        setUsers(result.users || []);
        setVerified(true);
        // Persist password in session for this tab so admin actions stay unlocked
        if (user) {
          setVertexUser({
            ...user,
            adminPassword: adminPass,
          });
        }
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Network error verifying administrator.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await executeLoadUsers(password);
  };

  const handleRefresh = async () => {
    const activePass = password || user?.adminPassword;
    if (activePass) {
      await executeLoadUsers(activePass);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    const activePass = password || user?.adminPassword;
    if (!activePass) {
      setMessage({ text: 'Administrator password is required to delete users.', type: 'error' });
      setDeletingUser(null);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc('delete_user', {
        p_user_id: deletingUser.id,
        p_admin_password: activePass,
      });
      const result = data as { success?: boolean; message?: string } | null;

      if (error || !result?.success) {
        setMessage({
          text: error?.message || result?.message || `Failed to delete user @${deletingUser.username}.`,
          type: 'error',
        });
      } else {
        setUsers((current) => current.filter((item) => item.id !== deletingUser.id));
        setMessage({
          text: `User @${deletingUser.username} (${deletingUser.full_name || 'No name'}) has been permanently deleted.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Network error while deleting user.', type: 'error' });
    } finally {
      setLoading(false);
      setDeletingUser(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const standard = users.filter((u) => u.role === 'user').length;
    return { total, admins, standard };
  }, [users]);

  if (!ready) return <div className="flex-1 bg-surface-dim" />;
  if (!user) return <AuthRequiredDialog />;
  if (user.role !== 'admin') {
    return (
      <main className="flex flex-1 items-center justify-center bg-surface-dim p-4">
        <section className="max-w-md border border-outline-variant bg-surface p-7 text-center shadow-xl">
          <span className="material-symbols-outlined text-4xl text-primary">shield_locked</span>
          <h1 className="mt-3 font-headline-sm text-2xl text-on-surface">Administrator access only</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">Your current account (@{user.username}) does not have administrator privileges to manage VERTEX users.</p>
          <Link href="/" className="mt-6 inline-flex bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-widest text-on-primary hover:bg-primary-container hover:text-on-primary-container">
            RETURN HOME
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-surface-dim p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold tracking-[.18em] text-primary">VERTEX ADMIN CONSOLE</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <h1 className="mt-2 font-headline-sm text-3xl text-on-surface">User Management</h1>
            <p className="mt-1 text-sm text-secondary">View all registered platform accounts and manage user access permissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-outline-variant px-4 py-2.5 font-mono text-[10px] font-bold tracking-widest text-secondary hover:border-primary hover:text-primary transition-colors bg-surface"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              RETURN HOME
            </Link>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            role="alert"
            className={`mt-4 flex items-center justify-between border p-4 text-sm ${
              message.type === 'error'
                ? 'border-error bg-error-container text-on-error-container'
                : message.type === 'success'
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                : 'border-primary/50 bg-primary/10 text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {message.type === 'error' ? 'error' : message.type === 'success' ? 'check_circle' : 'info'}
              </span>
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs uppercase tracking-wider underline hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Verification Form (shown only if not yet verified) */}
        {!verified ? (
          <section className="mt-8 max-w-md border border-outline-variant bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              <h2 className="font-headline-sm text-xl text-on-surface">Verify Administrator Password</h2>
            </div>
            <p className="text-sm leading-6 text-secondary">
              Enter the administrator password for <strong className="text-on-surface">@{user.username}</strong> to view and manage registered accounts.
            </p>
            <form onSubmit={handleManualVerify} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] tracking-widest text-secondary">ADMIN PASSWORD</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  minLength={8}
                  required
                  placeholder="Enter administrator password"
                  className="w-full border border-outline-variant bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:border-primary"
                />
              </label>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-primary px-4 py-3 font-mono text-[11px] font-bold tracking-widest text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    VERIFYING…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    AUTHENTICATE &amp; VIEW USERS
                  </>
                )}
              </button>
            </form>
          </section>
        ) : (
          /* User Management Section */
          <section className="mt-8 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border border-outline-variant bg-surface p-4">
                <div className="font-mono text-[10px] tracking-widest text-secondary uppercase">Total Accounts</div>
                <div className="mt-1 font-mono text-2xl font-bold text-on-surface">{userStats.total}</div>
              </div>
              <div className="border border-outline-variant bg-surface p-4">
                <div className="font-mono text-[10px] tracking-widest text-secondary uppercase">Regular Users</div>
                <div className="mt-1 font-mono text-2xl font-bold text-secondary">{userStats.standard}</div>
              </div>
              <div className="border border-primary/50 bg-primary/5 p-4">
                <div className="font-mono text-[10px] tracking-widest text-primary uppercase">Administrators</div>
                <div className="mt-1 font-mono text-2xl font-bold text-primary">{userStats.admins}</div>
              </div>
            </div>

            {/* Main Table Card */}
            <div className="border border-outline-variant bg-surface shadow-xl">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-outline-variant p-4 bg-surface-container-lowest">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username, name, or UUID..."
                    className="w-full border border-outline-variant bg-surface px-3 py-2 pl-9 text-xs text-on-surface placeholder:text-secondary/60 outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 border border-outline-variant bg-surface px-3 py-2 font-mono text-[10px] font-bold tracking-widest text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    REFRESH
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-outline-variant bg-surface-container-low font-mono text-[10px] tracking-widest text-secondary">
                    <tr>
                      <th className="p-4">USER DETAILS</th>
                      <th className="p-4">ROLE</th>
                      <th className="p-4">USER ID (UUID)</th>
                      <th className="p-4">JOINED DATE</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-secondary">
                          {searchQuery ? 'No accounts matched your search query.' : 'No registered users found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((account) => {
                        const isAdminAccount = account.role === 'admin';
                        return (
                          <tr key={account.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">
                                  {isAdminAccount ? 'shield_person' : 'person'}
                                </span>
                                <span>{account.full_name || account.username}</span>
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] text-secondary">
                                @{account.username}
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${
                                  isAdminAccount
                                    ? 'border border-primary/60 bg-primary/10 text-primary'
                                    : 'border border-outline-variant bg-surface-container text-secondary'
                                }`}
                              >
                                {isAdminAccount && <span className="material-symbols-outlined text-[12px]">security</span>}
                                {account.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-secondary select-all">
                              {account.id}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-secondary">
                              {new Date(account.created_at).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="p-4 text-right">
                              {isAdminAccount ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-secondary/60">
                                  <span className="material-symbols-outlined text-[14px]">lock</span>
                                  PROTECTED
                                </span>
                              ) : (
                                <button
                                  disabled={loading}
                                  onClick={() => setDeletingUser(account)}
                                  className="inline-flex items-center gap-1 border border-error/50 bg-error/10 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-error transition-colors hover:bg-error hover:text-on-error disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                  DELETE USER
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md border border-error bg-surface p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-error">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="font-headline-sm text-xl text-on-surface">Confirm User Deletion</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Are you sure you want to permanently delete user <strong className="text-on-surface">@{deletingUser.username}</strong> ({deletingUser.full_name || 'No name'})?
              </p>
              <div className="mt-3 border border-outline-variant bg-surface-container-low p-3 font-mono text-[11px] text-secondary">
                <div>ID: {deletingUser.id}</div>
                <div>Role: {deletingUser.role.toUpperCase()}</div>
              </div>
              <p className="mt-3 text-xs text-error font-medium">
                This action is irreversible and cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  disabled={loading}
                  onClick={() => setDeletingUser(null)}
                  className="border border-outline-variant px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-secondary hover:border-on-surface hover:text-on-surface"
                >
                  CANCEL
                </button>
                <button
                  disabled={loading}
                  onClick={confirmDeleteUser}
                  className="flex items-center gap-1.5 bg-error px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-on-error hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  )}
                  CONFIRM DELETE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
