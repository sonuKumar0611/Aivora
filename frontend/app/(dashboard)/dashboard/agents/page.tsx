'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBots } from '@/hooks/useBots';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Bot, Plus, Search } from 'lucide-react';
import { AgentCard } from '@/components/agents/AgentCard';

type StatusFilter = 'all' | 'draft' | 'published';

export default function AgentsPage() {
  const { bots, isLoading, isError, refetch } = useBots();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredBots = useMemo(() => {
    let list = bots;
    if (statusFilter !== 'all') {
      list = list.filter((b) => (b.status ?? 'draft') === statusFilter);
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.tone.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [bots, search, statusFilter]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-brand-textHeading">My Agents</h1>
          <p className="mt-1 text-sm text-brand-textMuted">
            Create and manage your support agents
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button className="transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4 mr-2 inline" />
            New agent
          </Button>
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1 content-start">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="flex-1 flex items-center justify-center min-h-0">
            <CardContent className="py-12">
              <ErrorState onRetry={() => refetch()} />
            </CardContent>
          </Card>
        ) : bots.length === 0 ? (
          <Card className="flex-1 flex items-center justify-center min-h-0 transition-shadow hover:shadow-md">
            <CardContent className="w-full flex items-center justify-center py-16">
              <EmptyState
                icon={<Bot className="w-12 h-12" />}
                title="No agents yet"
                description="Create an agent to get started. Set its name, business description, and tone."
                action={{ label: 'Create agent', onClick: () => window.location.assign('/dashboard/agents/new') }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="shrink-0 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-borderLight bg-brand-sidebar text-brand-text text-sm placeholder-brand-textDisabled focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div className="flex rounded-lg border border-brand-borderLight bg-brand-sidebar p-0.5">
                {(['all', 'draft', 'published'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === value
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-brand-textMuted hover:text-brand-text hover:bg-white/5'
                    }`}
                  >
                    {value === 'all' ? 'All' : value === 'draft' ? 'Draft' : 'Published'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {filteredBots.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-brand-textMuted text-sm">No agents match your search.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-2">
                  {filteredBots.map((bot) => (
                    <AgentCard
                      key={bot.id}
                      href={`/dashboard/agents/${bot.id}`}
                      name={bot.name}
                      tone={bot.tone}
                      description={bot.description ?? ''}
                      status={bot.status ?? 'draft'}
                      botType={bot.botType}
                      knowledgeCount={bot.assignedSourceIds?.length ?? 0}
                      updatedAt={bot.updatedAt}
                      isActive={bot.isActive}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
