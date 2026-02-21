'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useIntegrations, OAUTH_PROVIDERS } from '@/hooks/useIntegrations';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Plug, Calendar, Sheet, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { IntegrationItem, IntegrationProvider } from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

const PROVIDER_ICONS: Record<IntegrationProvider, React.ReactNode> = {
  google_calendar: <Calendar className="w-6 h-6 text-brand-textMuted" />,
  google_sheets: <Sheet className="w-6 h-6 text-brand-textMuted" />,
};

function IntegrationCard({
  item,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: {
  item: IntegrationItem;
  onConnect: (id: IntegrationProvider) => void;
  onDisconnect: (id: IntegrationProvider) => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}) {
  const busy = isConnecting || isDisconnecting;
  const Icon = PROVIDER_ICONS[item.id] ?? <Plug className="w-6 h-6 text-brand-textMuted" />;

  return (
    <Card
      className={clsx(
        'flex flex-col transition-all duration-200',
        'hover:border-brand-borderLight hover:shadow-md'
      )}
    >
      <CardContent className="p-5 flex flex-col flex-1 min-h-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-sidebar border border-brand-borderLight flex items-center justify-center">
            {Icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-textHeading truncate">{item.name}</h3>
            <p className="mt-0.5 text-sm text-brand-textMuted line-clamp-2">{item.description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {item.connected ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/15 text-green-400 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {item.linkedEmail ? `Connected as ${item.linkedEmail}` : 'Connected'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => onDisconnect(item.id)}
                className="text-brand-textMuted hover:text-brand-error"
              >
                {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => onConnect(item.id)}
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isHigherUp = user?.role === 'owner' || user?.role === 'admin';
  const { categories, isLoading, isError, refetch, connect, connectWithOAuth, disconnect } = useIntegrations({
    enabled: isHigherUp,
  });
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const hasExpandedInitial = useRef(false);

  useEffect(() => {
    if (categories.length > 0 && !hasExpandedInitial.current) {
      hasExpandedInitial.current = true;
      setExpandedCategories(new Set(categories.map((c) => c.category)));
    }
  }, [categories]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      toast.success(`${connected === 'google_calendar' ? 'Google Calendar' : 'Google Sheets'} connected`);
      refetch();
      window.history.replaceState({}, '', '/dashboard/integrations');
    } else if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, '', '/dashboard/integrations');
    }
  }, [searchParams, refetch]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q)
      return categories.map((c) => ({
        ...c,
        integrations: c.integrations,
      }));
    return categories
      .map((c) => ({
        ...c,
        integrations: c.integrations.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.integrations.length > 0);
  }, [categories, search]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (!isHigherUp) {
    return (
      <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-brand-textHeading">Integrations</h1>
          <p className="mt-1 text-sm text-brand-textMuted">Connect apps at the organization level.</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Plug className="w-12 h-12 mx-auto text-brand-textMuted/50 mb-4" />
            <h2 className="text-lg font-medium text-brand-textHeading">Access restricted</h2>
            <p className="mt-1 text-sm text-brand-textMuted max-w-md mx-auto">
              Only organization owners and admins can manage integrations. Contact your admin to connect apps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-brand-textHeading">Integrations</h1>
          <p className="mt-1 text-sm text-brand-textMuted">Connect your organization&apos;s apps.</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-textHeading">Integrations</h1>
          <p className="mt-1 text-sm text-brand-textMuted">
            Connect apps for your organization. Available to owners and admins.
          </p>
        </div>
        <div className="w-full sm:w-72 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted pointer-events-none" />
            <input
              type="search"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={clsx(
                'w-full rounded-lg border border-brand-borderLight bg-brand-sidebar pl-9 pr-3 py-2 text-sm text-brand-text placeholder-brand-textDisabled',
                'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0 focus:ring-offset-transparent'
              )}
              aria-label="Search integrations"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 min-h-0 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto space-y-8">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-10 h-10 mx-auto text-brand-textMuted/50 mb-4" />
                <p className="text-brand-textMuted">No integrations match your search.</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-2 text-sm font-medium text-brand-link hover:text-brand-linkHover"
                >
                  Clear search
                </button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map(({ category, integrations }) => (
              <section key={category} className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={clsx(
                    'flex items-center gap-2 w-full text-left font-semibold text-brand-textHeading',
                    'hover:text-brand-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg rounded'
                  )}
                >
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5 shrink-0 text-brand-textMuted" />
                  ) : (
                    <ChevronRight className="w-5 h-5 shrink-0 text-brand-textMuted" />
                  )}
                  {category}
                </button>
                {expandedCategories.has(category) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {integrations.map((item) => (
                      <IntegrationCard
                        key={item.id}
                        item={item}
                        onConnect={(id) => {
                          if (OAUTH_PROVIDERS.includes(id)) {
                            connectWithOAuth.mutate(id, {
                              onError: (err) => toast.error(getErrorMessage(err)),
                            });
                          } else {
                            connect.mutate(id, {
                              onSuccess: () => toast.success(`${item.name} connected`),
                              onError: (err) => toast.error(getErrorMessage(err)),
                            });
                          }
                        }}
                        onDisconnect={(id) => {
                          disconnect.mutate(id, {
                            onSuccess: () => toast.success(`${item.name} disconnected`),
                            onError: (err) => toast.error(getErrorMessage(err)),
                          });
                        }}
                        isConnecting={
                          (connect.isPending && connect.variables === item.id) ||
                          (connectWithOAuth.isPending && connectWithOAuth.variables === item.id)
                        }
                        isDisconnecting={disconnect.isPending && disconnect.variables === item.id}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
