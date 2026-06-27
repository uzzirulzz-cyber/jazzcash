'use client';

import { useState } from 'react';
import { Loader2, Mail, Lock, User, Trophy, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function AuthDialog() {
  const { authOpen, authMode, closeAuth, openAuth } = useApp();
  const { signup, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = authMode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (isSignup) {
      await signup(name, email, password);
    } else {
      await login(email, password);
    }
    setBusy(false);
  }

  function switchMode() {
    openAuth(isSignup ? 'login' : 'signup');
    setName(''); setEmail(''); setPassword('');
  }

  return (
    <Dialog open={authOpen} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="max-w-md">
        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </DialogClose>
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center">
            <img src="/logo.png" alt="PlayBeat Arena" className="h-12 w-12 rounded-xl object-contain" />
          </div>
          <DialogTitle className="text-xl">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isSignup
              ? 'Sign up to favorite channels, get live notifications & sync across devices. 100% free.'
              : 'Log in to access your favorites, watch history & notifications.'}
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 py-2">
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Your name" required />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-pass">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="auth-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSignup ? 'Create Account' : 'Log In'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={switchMode} className="font-semibold text-brand hover:underline">
            {isSignup ? 'Log in' : 'Sign up free'}
          </button>
        </div>

        {isSignup && (
          <p className="rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs text-emerald-600 dark:text-emerald-400">
            ✓ No subscription fee · ✓ All channels free · ✓ Live notifications
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
