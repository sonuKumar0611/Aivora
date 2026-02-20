'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') localStorage.removeItem('aivora_token');
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-row bg-brand-bg">
        <div className="w-56 flex-shrink-0 border-r border-brand-border bg-brand-sidebar animate-pulse">
          <div className="h-14 m-4 rounded-lg bg-brand-border" />
          <div className="space-y-2 px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-brand-border" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center min-w-0">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-brand-border border-t-brand-primary animate-spin" />
            <p className="text-sm text-brand-textMuted">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
