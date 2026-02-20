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
import { CreateBotModal } from '@/components/bots/CreateBotModal';
import { BotCard } from '@/components/bots/BotCard';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

export default function BotsPage() {
  const { bots, isLoading, isError, refetch, createBot } = useBots();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filteredBots = useMemo(() => {
    if (!search.trim()) return bots;
    const q = search.trim().toLowerCase();
    return bots.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.tone.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [bots, search]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-brand-textHeading">My Bots</h1>
          <p className="mt-1 text-sm text-brand-textMuted">
            Create and manage your support bots
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4 mr-2 inline" />
          New bot
        </Button>
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
                title="No bots yet"
                description="Create a bot to get started. Set its name, business description, and tone."
                action={{ label: 'Create bot', onClick: () => setShowCreate(true) }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative shrink-0 mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bots..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-borderLight bg-brand-sidebar text-brand-text text-sm placeholder-brand-textDisabled focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {filteredBots.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-brand-textMuted text-sm">No bots match your search.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-2">
                  {filteredBots.map((bot) => (
                    <BotCard
                      key={bot.id}
                      href={`/dashboard/bots/${bot.id}`}
                      name={bot.name}
                      tone={bot.tone}
                      description={bot.description ?? ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <CreateBotModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(body) => {
          createBot.mutate(
            {
              name: body.name,
              description: body.description,
              tone: body.tone,
              assignedSourceIds: body.assignedSourceIds,
            },
            {
              onSuccess: () => {
                setShowCreate(false);
                toast.success('Bot created');
              },
              onError: (err) => toast.error(getErrorMessage(err)),
            }
          );
        }}
        isLoading={createBot.isPending}
      />
    </div>
  );
}
