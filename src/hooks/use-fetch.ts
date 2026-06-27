'use client';

import { useEffect, useState, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Simple data-fetching hook with manual refetch + dependency tracking.
 */
export function useFetch<T>(url: string | null, deps: unknown[] = []): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (active) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
     
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch };
}

/** POST/PUT/DELETE helper returning { ok, error }. */
export async function apiAction(
  method: 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
