'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBots } from '@/hooks/useBots';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Bot } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { bots, isLoading, isError, refetch } = useBots();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your AI support bots
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 transition-colors">
                <Bot className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {isLoading ? '—' : bots.length}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total bots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent bots</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : bots.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-12 h-12" />}
              title="No bots yet"
              description="Create your first bot to get started with AI customer support."
              action={{ label: 'Create your first bot', onClick: () => router.push('/dashboard/bots') }}
            />
          ) : (
            <ul className="space-y-2">
              {bots.slice(0, 5).map((bot) => (
                <li key={bot.id}>
                  <Link
                    href={`/dashboard/bots/${bot.id}`}
                    className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 animate-in"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{bot.name}</span>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      {bot.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
