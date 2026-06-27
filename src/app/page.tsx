'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/lib/store';
import { HomeView } from '@/components/views/home-view';
import { CategoryView } from '@/components/views/category-view';
import { SearchView } from '@/components/views/search-view';
import { LibraryView } from '@/components/views/library-view';
import { AdminView } from '@/components/views/admin-view';
import { apiAction } from '@/hooks/use-fetch';

export default function Home() {
  const view = useApp((s) => s.view);
  const searchQuery = useApp((s) => s.searchQuery);

  // Ensure the database is seeded on first load.
  useEffect(() => {
    apiAction('POST', '/api/seed').catch(() => {});
  }, []);

  return (
    <AppShell>
      {view === 'home' && <HomeView />}
      {view === 'live' && <CategoryView viewId="live" />}
      {view === 'football' && <CategoryView viewId="football" />}
      {view === 'cricket' && <CategoryView viewId="cricket" />}
      {view === 'wrestling' && <CategoryView viewId="wrestling" />}
      {view === 'other-sports' && <CategoryView viewId="other-sports" />}
      {view === 'search' && <SearchView key={searchQuery} />}
      {view === 'favorites' && <LibraryView mode="favorites" />}
      {view === 'history' && <LibraryView mode="history" />}
      {view === 'admin' && <AdminView />}
    </AppShell>
  );
}
