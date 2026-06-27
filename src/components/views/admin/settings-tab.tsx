'use client';

import { useState } from 'react';
import { Save, Loader2, Globe, Clock, Shield, Palette } from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function SettingsTab() {
  const refreshTick = useApp((s) => s.refreshTick);
  const bumpRefresh = useApp((s) => s.bumpRefresh);
  const { data } = useFetch<{ settings: Record<string, string> }>('/api/settings', [refreshTick]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // merge loaded settings into form once
  const merged = { ...data?.settings, ...form };
  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const res = await apiAction('POST', '/api/settings', merged);
    setSaving(false);
    if (res.ok) { toast.success('Settings saved'); bumpRefresh(); }
    else toast.error(res.error || 'Failed');
  }

  const langs = [
    { value: 'en', label: 'English' }, { value: 'ur', label: 'اردو (Urdu)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' }, { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'es', label: 'Español' }, { value: 'fr', label: 'Français' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Platform-wide configuration. Changes apply immediately.</p>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Refresh & Import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Auto-refresh interval (hours)</Label>
              <Input type="number" min={1} max={24} value={merged.refreshHours ?? '6'} onChange={(e) => set('refreshHours', e.target.value)} />
              <p className="text-xs text-muted-foreground">Playlists re-import automatically on this schedule.</p>
            </div>
            <ToggleRow
              icon={<Shield className="h-4 w-4" />}
              label="Auto-disable offline streams"
              desc="Channels that fail health probes are disabled automatically."
              checked={merged.autoDisableOffline !== 'false'}
              onChange={(v) => set('autoDisableOffline', v ? 'true' : 'false')}
            />
            <ToggleRow
              icon={<Shield className="h-4 w-4" />}
              label="Detect & remove duplicates"
              desc="Cross-playlist duplicate detection during import."
              checked={merged.dedupe !== 'false'}
              onChange={(v) => set('dedupe', v ? 'true' : 'false')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" /> Localization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Interface language</Label>
              <Select value={merged.language ?? 'en'} onValueChange={(v) => set('language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{langs.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Geo-block restricted region (optional)</Label>
              <Input value={merged.geoBlock ?? ''} onChange={(e) => set('geoBlock', e.target.value)} placeholder="e.g. US, UK" />
              <p className="text-xs text-muted-foreground">Comma-separated country codes to block.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default theme</Label>
              <Select value={merged.theme ?? 'dark'} onValueChange={(v) => set('theme', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ToggleRow
              icon={<Globe className="h-4 w-4" />}
              label="Auto-fetch missing logos"
              desc="Attempt to fetch channel logos when not provided by the M3U."
              checked={merged.autoFetchLogos !== 'false'}
              onChange={(v) => set('autoFetchLogos', v ? 'true' : 'false')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Roles & Access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default visitor role</Label>
              <Select value={merged.defaultRole ?? 'viewer'} onValueChange={(v) => set('defaultRole', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Role-based access: Super Admin, Admin, Moderator, Viewer.</p>
            </div>
            <ToggleRow
              icon={<Globe className="h-4 w-4" />}
              label="EPG integration"
              desc="Auto-fetch electronic program guide for live schedules."
              checked={merged.epgEnabled === 'true'}
              onChange={(v) => set('epgEnabled', v ? 'true' : 'false')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }: { icon: React.ReactNode; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex gap-2.5">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
