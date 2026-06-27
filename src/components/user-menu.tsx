'use client';

import { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, UserCircle, Settings, ChevronDown } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { authUser, loading, logout, openAuth } = useAuth();
  const { setView } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Not logged in — show Login / Sign up buttons.
  if (!authUser && !loading) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openAuth('login')}
          className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
        >
          Log in
        </button>
        <button
          onClick={() => openAuth('signup')}
          className="rounded-lg brand-bg px-3 py-1.5 text-sm font-semibold"
        >
          Sign up
        </button>
      </div>
    );
  }

  // Loading state.
  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  const initials = (authUser?.name || authUser?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-muted"
        aria-label="User menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="brand-bg text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          {/* header */}
          <div className="border-b border-border p-3">
            <p className="truncate text-sm font-bold">{authUser?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{authUser?.email}</p>
          </div>
          {/* items */}
          <div className="p-1">
            <MenuItem icon={<UserCircle className="h-4 w-4" />} label="My Profile" onClick={() => { setView('profile'); setOpen(false); }} />
            <MenuItem icon={<Settings className="h-4 w-4" />} label="Admin Panel" onClick={() => { setView('admin'); setOpen(false); }} />
          </div>
          <div className="border-t border-border p-1">
            <MenuItem icon={<LogOut className="h-4 w-4" />} label="Log out" onClick={() => { logout(); setOpen(false); }} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
        danger ? 'text-red-600 hover:bg-red-500/10' : 'text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
