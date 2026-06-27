'use client';

import { useApp } from '@/lib/store';
import { apiAction } from '@/hooks/use-fetch';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

/** Hook that loads the current user on mount and exposes auth actions. */
export function useAuth() {
  const { authUser, setAuthUser, openAuth, closeAuth, bumpRefresh } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: { user: AuthUser | null }) => setAuthUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setAuthUser]);

  async function signup(name: string, email: string, password: string) {
    const res = await apiAction('POST', '/api/auth/signup', { name, email, password });
    if (res.ok) {
      setAuthUser(res.data as AuthUser);
      toast.success(`Welcome to PlayBeat Arena, ${name}!`);
      closeAuth();
      bumpRefresh();
    } else {
      toast.error(res.error || 'Signup failed');
    }
    return res.ok;
  }

  async function login(email: string, password: string) {
    const res = await apiAction('POST', '/api/auth/login', { email, password });
    if (res.ok) {
      setAuthUser(res.data as AuthUser);
      toast.success('Logged in successfully');
      closeAuth();
      bumpRefresh();
    } else {
      toast.error(res.error || 'Login failed');
    }
    return res.ok;
  }

  async function logout() {
    await apiAction('POST', '/api/auth/logout');
    setAuthUser(null);
    toast.success('Logged out');
    bumpRefresh();
    // Reload to get a fresh anonymous session cookie.
    setTimeout(() => window.location.reload(), 500);
  }

  return { authUser, loading, signup, login, logout, openAuth };
}
