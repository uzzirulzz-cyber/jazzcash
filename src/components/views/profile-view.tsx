'use client';

import { useState } from 'react';
import { UserCircle, Heart, History, Bell, Loader2, Save, Mail, Lock, Crown, Tv } from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChannelCard } from '@/components/channel-card';
import { toast } from 'sonner';
import type { ChannelDTO } from '@/lib/types';

interface ProfileData {
  user: {
    id: string; email: string | null; name: string | null; role: string;
    avatar: string | null; createdAt: string;
    _count: { favorites: number; watchHistory: number; channelSubs: number; notifications: number };
  };
}

export function ProfileView() {
  const refreshTick = useApp((s) => s.refreshTick);
  const { authUser, openAuth } = useAuth();
  const { data, loading, refetch } = useFetch<ProfileData>('/api/profile', [refreshTick]);
  const { data: subData } = useFetch<{ favorites: ChannelDTO[] }>('/api/favorites', [refreshTick]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);

  // Not logged in — show signup prompt.
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <UserCircle className="mb-3 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign up to view your profile</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a free account to access your favorites, watch history & live notifications.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => openAuth('signup')}>Sign up free</Button>
          <Button variant="outline" onClick={() => openAuth('login')}>Log in</Button>
        </div>
      </div>
    );
  }

  async function saveProfile() {
    setSaving(true);
    const payload: Record<string, unknown> = { name };
    if (newPass) {
      payload.oldPassword = oldPass;
      payload.newPassword = newPass;
    }
    const res = await apiAction('PATCH', '/api/profile', payload);
    setSaving(false);
    if (res.ok) {
      toast.success('Profile updated');
      setEditing(false);
      setOldPass(''); setNewPass('');
      refetch();
    } else {
      toast.error(res.error || 'Update failed');
    }
  }

  const user = data?.user;
  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="brand-bg text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{user?.name || 'User'}</h1>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Crown className="h-3 w-3 text-emerald-500" /> Free Plan
                </Badge>
                {user?.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button variant={editing ? 'outline' : 'default'} onClick={() => { setEditing(!editing); setName(user?.name ?? ''); }}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox icon={<Heart className="h-4 w-4" />} label="Favorites" value={user?._count.favorites ?? 0} accent="text-red-500" />
            <StatBox icon={<History className="h-4 w-4" />} label="Watched" value={user?._count.watchHistory ?? 0} accent="text-brand" />
            <StatBox icon={<Bell className="h-4 w-4" />} label="Subscribed" value={user?._count.channelSubs ?? 0} accent="text-amber-500" />
            <StatBox icon={<Tv className="h-4 w-4" />} label="Notifications" value={user?._count.notifications ?? 0} accent="text-violet-500" />
          </div>
        </CardContent>
      </Card>

      {/* edit form */}
      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email (cannot be changed)</Label>
              <Input value={user?.email ?? ''} disabled className="bg-muted" />
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-semibold">Change password (optional)</p>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="pl-9" placeholder="Current password" />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="pl-9" placeholder="New password (min 6 chars)" />
                </div>
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* favorite channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-red-500" /> Your Favorite Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(subData?.favorites ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No favorites yet. Tap the heart on any channel to add it here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {(subData?.favorites ?? []).slice(0, 12).map((ch) => (
                <ChannelCard key={ch.id} channel={ch} className="w-full" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-3">
      <span className={accent}>{icon}</span>
      <div>
        <p className="text-lg font-extrabold">{value}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
