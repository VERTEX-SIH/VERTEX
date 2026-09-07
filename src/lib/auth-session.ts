'use client';

import { useEffect, useState } from 'react';

export type VertexUser = {
  id: string | null;
  username: string;
  fullName: string | null;
  role: 'user' | 'admin';
  adminPassword?: string;
};

const STORAGE_KEY = 'vertex_user';
const AUTH_EVENT = 'vertex-auth-changed';

export function getVertexUser(): VertexUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const user = JSON.parse(value) as VertexUser;
    return user?.username ? user : null;
  } catch {
    return null;
  }
}

export function setVertexUser(user: VertexUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearVertexUser() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useVertexUser() {
  const [user, setUser] = useState<VertexUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setUser(getVertexUser());
      setReady(true);
    };

    refresh();
    window.addEventListener(AUTH_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(AUTH_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return { user, ready };
}
