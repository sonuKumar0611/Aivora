'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBots } from '@/hooks/useBots';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Bot, Plus } from 'lucide-react';
import { CreateBotModal } from '@/components/bots/CreateBotModal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

export default function BotsPage() {
  const { bots, isLoading, isError, refetch, createBot } = useBots();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">My Bots</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create and manage your support bots
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4 mr-2 inline" />
          New bot
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Card>
          <CardContent className="py-12">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : bots.length === 0 ? (
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="py-4">
            <EmptyState
              icon={<Bot className="w-12 h-12" />}
              title="No bots yet"
              description="Create a bot to get started. Set its name, business description, and tone."
              action={{ label: 'Create bot', onClick: () => setShowCreate(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <Link key={bot.id} href={`/dashboard/bots/${bot.id}`} className="block animate-in">
              <Card className="h-full hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {bot.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{bot.tone}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {bot.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateBotModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(body) => {
          createBot.mutate(body, {
            onSuccess: () => {
              setShowCreate(false);
              toast.success('Bot created');
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          });
        }}
        isLoading={createBot.isPending}
      />
    </div>
  );
}
