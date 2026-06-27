'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Loader2, ChevronRight } from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryNode {
  id: string; name: string; slug: string; parentId: string | null;
  icon: string | null; color: string | null; keywords: string; isCustom: boolean; sortOrder: number;
  children?: CategoryNode[];
}

const ICONS = ['Trophy', 'Target', 'Swords', 'Medal', 'Star', 'Flame', 'Activity', 'Tv'];
const COLORS = ['text-emerald-500', 'text-amber-500', 'text-rose-500', 'text-violet-500', 'text-orange-500', 'text-cyan-500'];

export function CategoriesTab() {
  const refreshTick = useApp((s) => s.refreshTick);
  const bumpRefresh = useApp((s) => s.bumpRefresh);
  const { data, loading, refetch } = useFetch<{ categories: CategoryNode[] }>('/api/categories', [refreshTick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          View and manage the sports category hierarchy. Create custom categories like “PSL 2026” or “Olympic Games”.
        </p>
        <CreateCategoryDialog parents={data?.categories ?? []} onCreated={() => { bumpRefresh(); refetch(); }} />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', cat.color ?? 'text-brand')}>
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{cat.name}</h3>
                        {cat.isCustom && <Badge variant="secondary" className="text-[10px]">custom</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cat.children?.length ?? 0} subcategories
                        {cat.keywords && <span> · keywords: {cat.keywords.split(',').slice(0, 4).join(', ')}{cat.keywords.split(',').length > 4 ? '…' : ''}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <CreateCategoryDialog parents={data?.categories ?? []} defaultParent={cat.id} onCreated={() => { bumpRefresh(); refetch(); }} trigger={
                      <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> Sub</Button>
                    } />
                    <EditCategoryDialog category={cat} onSaved={() => { bumpRefresh(); refetch(); }} />
                    {cat.isCustom && <DeleteCategoryDialog category={cat} onDeleted={() => { bumpRefresh(); refetch(); }} />}
                  </div>
                </div>

                {/* subcategories */}
                {cat.children && cat.children.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {cat.children.map((sub) => (
                      <div key={sub.id} className="group flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{sub.name}</span>
                        {sub.isCustom && <Badge variant="outline" className="text-[9px]">custom</Badge>}
                        <EditCategoryDialog category={sub} onSaved={() => { bumpRefresh(); refetch(); }} small />
                        {sub.isCustom && <DeleteCategoryDialog category={sub} onDeleted={() => { bumpRefresh(); refetch(); }} small />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCategoryDialog({ parents, defaultParent, onCreated, trigger }: {
  parents: CategoryNode[];
  defaultParent?: string;
  onCreated: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(defaultParent ?? '');
  const [keywords, setKeywords] = useState('');
  const [icon, setIcon] = useState(ICONS[3]);
  const [color, setColor] = useState(COLORS[3]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await apiAction('POST', '/api/categories', {
      name: name.trim(),
      parentId: parentId || null,
      keywords: keywords.trim(),
      icon, color,
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Category created');
      setName(''); setKeywords('');
      setOpen(false);
      onCreated();
    } else toast.error(res.error || 'Failed');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setParentId(defaultParent ?? ''); } }}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Category</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Custom Category</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PSL 2026, Olympic Games" />
          </div>
          <div className="space-y-2">
            <Label>Parent (optional)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Top-level category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Top level —</SelectItem>
                {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Keywords (comma-separated, for auto-mapping)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="psl, pakistan super league" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={saving || !name.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({ category, onSaved, small }: { category: CategoryNode; onSaved: () => void; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [keywords, setKeywords] = useState(category.keywords);
  const [icon, setIcon] = useState(category.icon ?? ICONS[3]);
  const [color, setColor] = useState(category.color ?? COLORS[3]);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await apiAction('PATCH', `/api/categories/${category.id}`, { name, keywords, icon, color });
    setSaving(false);
    if (res.ok) { toast.success('Category updated'); setOpen(false); onSaved(); }
    else toast.error(res.error || 'Failed');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={small ? 'icon' : 'sm'} variant="ghost" className={small ? 'h-6 w-6 opacity-0 group-hover:opacity-100' : ''}>
          <Pencil className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Keywords</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({ category, onDeleted, small }: { category: CategoryNode; onDeleted: () => void; small?: boolean }) {
  const [deleting, setDeleting] = useState(false);
  async function del() {
    setDeleting(true);
    const res = await apiAction('DELETE', `/api/categories/${category.id}`);
    setDeleting(false);
    if (res.ok) { toast.success('Category deleted'); onDeleted(); }
    else toast.error(res.error || 'Failed');
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={small ? 'icon' : 'sm'} variant="ghost" className={cn('text-red-600 hover:text-red-700', small && 'h-6 w-6 opacity-0 group-hover:opacity-100')}>
          <Trash2 className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>Channels mapped to this category will keep their current assignment.</AlertDialogDescription>
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
