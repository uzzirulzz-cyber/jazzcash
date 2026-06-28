'use client';

import { useApp } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { AdminView } from '@/components/views/admin-view';
import { AuthDialog } from '@/components/auth-dialog';
import { IptvPlayer } from '@/components/iptv-player';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/** Standalone admin application shell (rendered at /admin route). */
export function AdminApp() {
  const { authUser, loading, logout, openAuth } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // While loading auth state, show a spinner.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-brand" />
      </div>
    );
  }

  // If not logged in, show admin login prompt.
  if (!authUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl brand-bg">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Admin Panel</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          You need to be logged in with an admin account to access this panel.
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => openAuth('login')}>Log in</Button>
          <Button variant="outline" onClick={() => openAuth('signup')}>Sign up</Button>
        </div>
        <Link href="/" className="mt-4 text-xs text-muted-foreground hover:text-foreground">
          ← Back to PlayBeat Arena
        </Link>
        <AuthDialog />
        <Toaster />
      </div>
    );
  }

  // Logged in — show the admin panel.
  return (
    <div className="min-h-screen bg-background">
      {/* Admin top bar — NOT sticky, stays at top of page naturally */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PlayBeat Arena" className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <span className="text-sm font-extrabold">PlayBeat Arena</span>
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {authUser.name} · <span className="capitalize">{authUser.role.replace('_', ' ')}</span>
            </span>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> View Site
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Admin content */}
      <div className="mx-auto max-w-[1600px] px-4 pb-6 pt-6 sm:px-6">
        <AdminView />
      </div>

      <IptvPlayer />
      <AuthDialog />
      <Toaster />
    </div>
  );
}
