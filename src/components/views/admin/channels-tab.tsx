'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Pencil, Trash2, RefreshCw, Power, Star, Flame, Radio, Loader2, Wand2, Tv, Copy, Upload, Layers, X, Activity } from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { ChannelDTO } from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Football', 'Cricket', 'Wrestling', 'Other Sports'];
const SUBCATS: Record<string, string[]> = {
  Football: ['Live Football', 'Premier League', 'UEFA Champions League', 'Europa League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'Saudi Pro League', 'International Football', 'World Cup', 'AFC Competitions', 'Match Highlights', 'Match Replays'],
  Cricket: ['Live Cricket', 'IPL', 'PSL', 'BBL', 'CPL', 'ICC Events', 'Asia Cup', 'Test Cricket', 'ODI', 'T20', 'Highlights', 'Classic Matches'],
  Wrestling: ['WWE RAW', 'SmackDown', 'NXT', 'AEW', 'UFC', 'PPV Events', 'WrestleMania', 'Royal Rumble', 'SummerSlam', 'Archives'],
  'Other Sports': ['Basketball', 'Tennis', 'Baseball', 'Formula 1', 'MotoGP', 'Boxing', 'MMA', 'Golf', 'Rugby', 'Ice Hockey', 'Olympics', 'Multi Sports'],
};

export function ChannelsTab() {
  const refreshTick = useApp((s) => s.refreshTick);
  const bumpRefresh = useApp((s) => s.bumpRefresh);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [sourceId, setSourceId] = useState('all');
  const [page, setPage] = useState(0);
  const [probingId, setProbingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deduping, setDeduping] = useState(false);
  const pageSize = 25;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(channels.map((c) => c.id)));
  }
  function clearSelection() {
    setSelected(new Set());
  }
  async function dedupeAll() {
    setDeduping(true);
    toast.info('Scanning for duplicates…');
    const res = await apiAction('POST', '/api/channels/dedupe');
    setDeduping(false);
    if (res.ok) {
      const r = res.data as { removed: number; remaining: number };
      toast.success(`Removed ${r.removed} duplicates (${r.remaining} remaining)`);
      bumpRefresh(); refetch();
    } else toast.error(res.error || 'Dedupe failed');
  }

  const [probing, setProbing] = useState(false);
  async function probeBatch() {
    setProbing(true);
    toast.info('Testing stream health (up to 100 channels)…');
    const res = await apiAction('POST', '/api/admin/probe-batch', { limit: 100, featuredOnly: true });
    setProbing(false);
    if (res.ok) {
      const r = res.data as { tested: number; working: number; broken: number };
      toast.success(`Tested ${r.tested}: ${r.working} working, ${r.broken} broken`);
      bumpRefresh(); refetch();
    } else toast.error(res.error || 'Probe failed');
  }

  const params = useMemo(() => {
    const p = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), enabled: 'any' });
    if (q) p.set('q', q);
    if (category !== 'all') p.set('category', category);
    if (sourceId !== 'all') p.set('sourceId', sourceId);
    return p.toString();
  }, [q, category, sourceId, page]);

  const { data, loading, refetch } = useFetch<{ channels: ChannelDTO[]; total: number }>(`/api/channels?${params}`, [refreshTick]);
  const { data: plData } = useFetch<{ playlists: { id: string; name: string }[] }>('/api/playlists', [refreshTick]);

  const channels = data?.channels ?? [];
  const total = data?.total ?? 0;

  async function probe(id: string) {
    setProbingId(id);
    const res = await apiAction('POST', `/api/channels/${id}/probe`);
    setProbingId(null);
    if (res.ok) {
      const status = (res.data as { status: string }).status;
      toast.success(`Stream ${status}`);
      bumpRefresh();
      refetch();
    } else toast.error(res.error || 'Probe failed');
  }

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search channels…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {plData?.playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={probeBatch} disabled={probing} title="Test stream health for top channels">
          {probing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          Test Streams
        </Button>
        <Button variant="outline" size="sm" onClick={dedupeAll} disabled={deduping} title="Remove duplicate channels across all playlists">
          {deduping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          Remove Duplicates
        </Button>
        <Button variant={selected.size > 0 ? 'default' : 'outline'} size="sm" onClick={() => setBulkOpen(true)} disabled={selected.size === 0}>
          <Layers className="h-4 w-4" />
          Bulk Edit {selected.size > 0 && `(${selected.size})`}
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} channels</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="flex items-center px-2 text-xs">Page {page + 1}</span>
          <Button size="sm" variant="outline" disabled={(page + 1) * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={channels.length > 0 && channels.every((c) => selected.has(c.id))}
                  onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="min-w-[200px]">Channel</TableHead>
              <TableHead className="min-w-[140px]">Category</TableHead>
              <TableHead className="min-w-[120px]">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><div className="h-8 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No channels found.</TableCell>
              </TableRow>
            ) : (
              channels.map((ch) => (
                <TableRow key={ch.id} data-selected={selected.has(ch.id)} className={selected.has(ch.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={selected.has(ch.id)}
                      onChange={() => toggleSelect(ch.id)}
                      aria-label={`Select ${ch.displayName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ch.logo ? (
                         
                        <img src={ch.logo} alt="" className="h-8 w-8 rounded object-contain" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted"><Tv className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ch.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{ch.country || '—'}{ch.language ? ` · ${ch.language}` : ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{ch.category}</div>
                    {ch.subcategory && <div className="text-xs text-muted-foreground">{ch.subcategory}</div>}
                    {ch.categoryMode === 'manual' && <Badge variant="outline" className="mt-0.5 text-[9px]">manual</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ch.sourceName}</TableCell>
                  <TableCell>
                    <Badge variant={ch.status === 'online' ? 'default' : ch.status === 'offline' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {ch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ch.enabled ? <Power className="h-3.5 w-3.5 text-emerald-500" /> : <Power className="h-3.5 w-3.5 text-muted-foreground" />}
                      {ch.featured && <Star className="h-3.5 w-3.5 text-amber-500" />}
                      {ch.trending && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                      {ch.liveNow && <Radio className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => probe(ch.id)} disabled={probingId === ch.id} title="Probe stream">
                        {probingId === ch.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                      <EditChannelDialog channel={ch} onSaved={() => { bumpRefresh(); refetch(); }} />
                      <DeleteChannelDialog channel={ch} onDeleted={() => { bumpRefresh(); refetch(); }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* bulk edit */}
      <BulkEditDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selectedIds={Array.from(selected)}
        onDone={() => { clearSelection(); bumpRefresh(); refetch(); }}
      />
    </div>
  );
}

function LogoUpload({ channelId, onUploaded }: { channelId: string; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch(`/api/channels/${channelId}/logo`, { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.logo) {
        toast.success('Logo uploaded');
        onUploaded(json.logo);
      } else {
        toast.error(json.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={onFile} />
      <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload logo">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </>
  );
}

function BulkEditDialog({ open, onOpenChange, selectedIds, onDone }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedIds: string[];
  onDone: () => void;
}) {
  const [action, setAction] = useState<string>('enable');
  const [category, setCategory] = useState<string>('Football');
  const [subcategory, setSubcategory] = useState<string>('none');
  const [applying, setApplying] = useState(false);

  const actions = [
    { value: 'enable', label: 'Enable channels' },
    { value: 'disable', label: 'Disable channels' },
    { value: 'feature', label: 'Mark as Featured' },
    { value: 'unfeature', label: 'Remove Featured' },
    { value: 'trend', label: 'Mark as Trending' },
    { value: 'untrend', label: 'Remove Trending' },
    { value: 'live', label: 'Mark as Live Now' },
    { value: 'unlive', label: 'Remove Live Now' },
    { value: 'recategory', label: 'Change category' },
    { value: 'delete', label: 'Delete channels', danger: true },
  ];

  async function apply() {
    setApplying(true);
    const payload: Record<string, unknown> = { ids: selectedIds, action };
    if (action === 'recategory') {
      payload.category = category;
      payload.subcategory = subcategory === 'none' ? null : subcategory;
    }
    const res = await apiAction('POST', '/api/channels/bulk', payload);
    setApplying(false);
    if (res.ok) {
      const r = res.data as { updated: number };
      toast.success(`Updated ${r.updated} channel${r.updated === 1 ? '' : 's'}`);
      onOpenChange(false);
      onDone();
    } else toast.error(res.error || 'Bulk action failed');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Bulk Edit — {selectedIds.length} channels
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actions.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {action === 'recategory' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory('none'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {(SUBCATS[category] ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {action === 'delete' && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
              This will permanently delete {selectedIds.length} channels. This cannot be undone.
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={apply} disabled={applying} variant={action === 'delete' ? 'destructive' : 'default'}>
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply to {selectedIds.length} channels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditChannelDialog({ channel, onSaved }: { channel: ChannelDTO; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(channel.displayName);
  const [logo, setLogo] = useState(channel.logo ?? '');
  const [category, setCategory] = useState(channel.category);
  const [subcategory, setSubcategory] = useState(channel.subcategory ?? 'none');
  const [country, setCountry] = useState(channel.country ?? '');
  const [language, setLanguage] = useState(channel.language ?? '');
  const [enabled, setEnabled] = useState(channel.enabled);
  const [featured, setFeatured] = useState(channel.featured);
  const [trending, setTrending] = useState(channel.trending);
  const [liveNow, setLiveNow] = useState(channel.liveNow);
  const [saving, setSaving] = useState(false);

  function reset() {
    setDisplayName(channel.displayName);
    setLogo(channel.logo ?? '');
    setCategory(channel.category);
    setSubcategory(channel.subcategory ?? 'none');
    setCountry(channel.country ?? '');
    setLanguage(channel.language ?? '');
    setEnabled(channel.enabled);
    setFeatured(channel.featured);
    setTrending(channel.trending);
    setLiveNow(channel.liveNow);
  }

  async function save() {
    setSaving(true);
    const res = await apiAction('PATCH', `/api/channels/${channel.id}`, {
      displayName,
      logo: logo || null,
      category,
      subcategory: subcategory === 'none' ? null : subcategory,
      country: country || null,
      language: language || null,
      enabled,
      featured,
      trending,
      liveNow,
    });
    setSaving(false);
    if (res.ok) { toast.success('Channel updated'); setOpen(false); onSaved(); }
    else toast.error(res.error || 'Failed');
  }

  async function reAuto() {
    setSaving(true);
    const res = await apiAction('PATCH', `/api/channels/${channel.id}`, { reAuto: true });
    setSaving(false);
    if (res.ok) {
      toast.success('Re-categorized');
      const ch = (res.data as { channel: ChannelDTO }).channel;
      setCategory(ch.category);
      setSubcategory(ch.subcategory ?? 'none');
      onSaved();
    } else toast.error(res.error || 'Failed');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Channel</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1 scroll-thin">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" />
              <LogoUpload channelId={channel.id} onUploaded={(url) => setLogo(url)} />
            </div>
            {logo && (
              <div className="flex items-center gap-2 rounded-lg border border-border p-2">
                { }
                <img src={logo} alt="" className="h-10 w-10 rounded object-contain" />
                <span className="truncate text-xs text-muted-foreground">{logo}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory('none'); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {(SUBCATS[category] ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ToggleRow label="Enabled" checked={enabled} onChange={setEnabled} />
            <ToggleRow label="Featured" checked={featured} onChange={setFeatured} />
            <ToggleRow label="Trending" checked={trending} onChange={setTrending} />
            <ToggleRow label="Live now" checked={liveNow} onChange={setLiveNow} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={reAuto} disabled={saving}>
            <Wand2 className="h-4 w-4" /> Re-auto categorize
          </Button>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function DeleteChannelDialog({ channel, onDeleted }: { channel: ChannelDTO; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  async function del() {
    setDeleting(true);
    const res = await apiAction('DELETE', `/api/channels/${channel.id}`);
    setDeleting(false);
    if (res.ok) { toast.success('Channel deleted'); onDeleted(); }
    else toast.error(res.error || 'Failed');
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete channel?</AlertDialogTitle>
          <AlertDialogDescription>“{channel.displayName}” will be permanently removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={del} disabled={deleting} className="bg-red-600 hover:bg-red-700">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
