'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Tv, X } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useApp } from '@/lib/store';
import { ChannelCard } from '@/components/channel-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ChannelDTO } from '@/lib/types';

interface SearchData {
  total: number;
  channels: ChannelDTO[];
  facets: {
    countries: string[];
    languages: string[];
    categories: { name: string; count: number }[];
  };
}

export function SearchView() {
  const { searchQuery, setSearchQuery } = useApp();
  const refreshTick = useApp((s) => s.refreshTick);
  const [input, setInput] = useState(searchQuery);
  const [country, setCountry] = useState<string>('all');
  const [language, setLanguage] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [debounced, setDebounced] = useState(searchQuery);

  // debounce the query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(input);
      setSearchQuery(input);
    }, 350);
    return () => clearTimeout(t);
  }, [input, setSearchQuery]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ limit: '120' });
    if (debounced) p.set('q', debounced);
    if (country !== 'all') p.set('country', country);
    if (language !== 'all') p.set('language', language);
    if (category !== 'all') p.set('category', category);
    return p.toString();
  }, [debounced, country, language, category]);

  const { data, loading } = useFetch<SearchData>(`/api/search?${params}`, [refreshTick]);

  const hasFilters = country !== 'all' || language !== 'all' || category !== 'all';

  return (
    <div className="space-y-5">
      {/* header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find channels by name, league, team, competition, country, language or category.
        </p>
      </div>

      {/* search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Sky Sports, Premier League, Willow, ESPN, Pakistan…"
            className="pl-9"
            autoFocus
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters((s) => !s)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && <span className="flex h-2 w-2 rounded-full bg-brand-foreground" />}
        </Button>
      </div>

      {/* filters */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {data?.facets.categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="All countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {data?.facets.countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue placeholder="All languages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {data?.facets.languages.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="sm:col-span-3 w-fit"
              onClick={() => { setCountry('all'); setLanguage('all'); setCategory('all'); }}
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      )}

      {/* results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Searching…' : `${data?.total ?? 0} result${(data?.total ?? 0) === 1 ? '' : 's'}`}
          {debounced && <span> for <span className="font-medium text-foreground">“{debounced}”</span></span>}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video bg-muted" />
              <div className="space-y-2 p-2.5">
                <div className="h-3.5 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (data?.channels ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Tv className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No channels found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different keyword or remove some filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data?.channels.map((ch) => (
            <ChannelCard key={ch.id} channel={ch} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
